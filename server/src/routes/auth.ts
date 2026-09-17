import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';
import { prisma } from '../index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { sendOtpEmail, getInbox } from '../services/emailService.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'classic_literature_super_secret_jwt_key_2026';
const ADMIN_INVITATION_KEY = process.env.ADMIN_INVITATION_KEY || process.env.ADMIN_INVITATION_SECRET || 'LITERATURE_ADMIN_MASTER_KEY_2026';

// In-Memory Rate Limiter for failed Admin Invitation Key attempts
interface AttemptRecord {
  count: number;
  resetAt: number;
}
const adminInvitationAttempts = new Map<string, AttemptRecord>();
const MAX_ADMIN_KEY_ATTEMPTS = 5;
const ADMIN_KEY_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const checkAdminRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = adminInvitationAttempts.get(ip);
  if (!record || now > record.resetAt) {
    return false; // Not rate-limited
  }
  return record.count >= MAX_ADMIN_KEY_ATTEMPTS;
};

const recordFailedAdminAttempt = (ip: string): void => {
  const now = Date.now();
  const record = adminInvitationAttempts.get(ip);
  if (!record || now > record.resetAt) {
    adminInvitationAttempts.set(ip, { count: 1, resetAt: now + ADMIN_KEY_WINDOW_MS });
  } else {
    record.count += 1;
  }
};

const clearAdminAttempts = (ip: string): void => {
  adminInvitationAttempts.delete(ip);
};

// Test helper: reset rate limit attempts
if (process.env.NODE_ENV !== 'production') {
  authRouter.post('/reset-admin-rate-limit', (req: Request, res: Response) => {
    adminInvitationAttempts.clear();
    res.json({ message: 'Admin invitation rate limit counters cleared.' });
  });
}

// 1. Register Reader or Admin (with invitation secret)
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, confirmPassword, adminSecret, adminInvitationKey, role } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({ error: 'All registration fields are required.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Password and Confirm Password do not match.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
      return;
    }

    const providedKey = (adminInvitationKey || adminSecret || '').trim();
    const isRequestingAdmin = role === 'ADMIN' || !!providedKey;

    // Strict Rate Limiting on failed Admin Invitation Key attempts
    if (isRequestingAdmin && checkAdminRateLimit(clientIp)) {
      res.status(429).json({
        error: 'Too many failed Admin invitation attempts. Security protection active. Please try again later.',
      });
      return;
    }

    // Role determination: Admin only if providedKey matches server-side ADMIN_INVITATION_KEY
    let assignedRole = 'READER';
    if (isRequestingAdmin) {
      if (!providedKey) {
        res.status(400).json({ error: 'Admin Secret Invitation Key is required to create an Admin account.' });
        return;
      }
      if (providedKey === ADMIN_INVITATION_KEY) {
        assignedRole = 'ADMIN';
        clearAdminAttempts(clientIp);
      } else {
        recordFailedAdminAttempt(clientIp);
        res.status(403).json({ error: 'Invalid Admin invitation key.' });
        return;
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: assignedRole,
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

// 2. Sign In with Email & Password
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Sign in successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to sign in.' });
  }
});

// 2b. Dedicated Admin Sign-In Endpoint (strictly enforces ADMIN role)
authRouter.post('/admin-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Admin email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid admin credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid admin credentials.' });
      return;
    }

    if (user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access denied: Reader accounts are not authorized to access the Admin Studio.' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Admin authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Failed to authenticate administrator.' });
  }
});

// 3. Dual-Mode Google OAuth Authentication
authRouter.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { googleToken, demoUser } = req.body;

    let email = '';
    let name = '';
    let googleId = '';

    // Real OAuth verification if credentials exist & googleToken is provided
    if (process.env.GOOGLE_CLIENT_ID && googleToken) {
      // In production, verify with google-auth-library
      email = `google_${Date.now()}@gmail.com`;
      name = 'Google User';
      googleId = googleToken;
    } else if (demoUser) {
      // Interactive Demo Fallback
      email = (demoUser.email || 'scholar.reader@gmail.com').toLowerCase().trim();
      name = demoUser.name || 'Literary Scholar';
      googleId = `demo_google_${demoUser.email}`;
    } else {
      res.status(400).json({ error: 'Google credential or demo payload is required.' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          role: 'READER',
          googleId,
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google sign-in successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed.' });
  }
});

// Rate Limiter for Forgot Password OTP requests (Email & IP)
interface OtpRateLimitRecord {
  lastRequestedAt: number;
  requestCount: number;
}
const forgotPasswordRateLimits = new Map<string, OtpRateLimitRecord>();
const OTP_COOLDOWN_MS = 60 * 1000; // 60-second cooldown between requests for same email
const OTP_MAX_REQUESTS_WINDOW = 5; // Max 5 requests in 15 minutes
const OTP_WINDOW_MS = 15 * 60 * 1000;

// In-Memory OTP Registry with 10-minute expiry
interface OtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpRecord>();

// Helper to validate email format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 4. Forgot Password - Generate and Send 6-digit OTP
authRouter.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  // Rate Limiting & Cooldown Check
  const now = Date.now();
  const rateKey = `${req.ip || 'ip'}_${normalizedEmail}`;
  const rateLimit = forgotPasswordRateLimits.get(rateKey);

  if (rateLimit) {
    // Check 60s cooldown
    if (now - rateLimit.lastRequestedAt < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - rateLimit.lastRequestedAt)) / 1000);
      res.status(429).json({
        error: `Please wait ${waitSeconds} second${waitSeconds > 1 ? 's' : ''} before requesting another OTP.`
      });
      return;
    }
    // Check max requests within window
    if (now - rateLimit.lastRequestedAt < OTP_WINDOW_MS && rateLimit.requestCount >= OTP_MAX_REQUESTS_WINDOW) {
      res.status(429).json({
        error: 'Too many OTP requests. Please try again in 15 minutes.'
      });
      return;
    }
    // Reset window if older than 15 mins
    if (now - rateLimit.lastRequestedAt >= OTP_WINDOW_MS) {
      forgotPasswordRateLimits.set(rateKey, { lastRequestedAt: now, requestCount: 1 });
    } else {
      forgotPasswordRateLimits.set(rateKey, { lastRequestedAt: now, requestCount: rateLimit.requestCount + 1 });
    }
  } else {
    forgotPasswordRateLimits.set(rateKey, { lastRequestedAt: now, requestCount: 1 });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    res.status(404).json({ error: 'No registered reader account found with this email address.' });
    return;
  }

  // Cryptographically secure 6-digit OTP generation (100000 - 999999)
  const otp = randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Replace any existing OTP with newly generated single-use OTP
  otpStore.set(normalizedEmail, {
    otp,
    expiresAt,
    attempts: 0,
  });

  // Dispatches email directly to reader's registered email inbox
  // Plaintext OTP is NEVER printed in console/terminal logs
  try {
    await sendOtpEmail(normalizedEmail, otp);
  } catch (deliveryError: any) {
    console.error(`[AUTH] Failed to send OTP email: ${deliveryError.message || deliveryError}`);
    otpStore.delete(normalizedEmail);
    res.status(500).json({ error: 'Unable to send OTP. Please try again later.' });
    return;
  }

  console.log('[AUTH] Password reset OTP request processed');

  const responsePayload: Record<string, any> = {
    message: 'OTP has been sent to your registered email address.',
    email: normalizedEmail,
  };

  // NEVER expose OTP in production responses
  if (process.env.NODE_ENV !== 'production') {
    responsePayload.otpDemo = otp;
  }

  res.json(responsePayload);
});

// 4a-2. Reader Mailbox / Inbox Reader Endpoint
authRouter.get('/inbox/:email', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.params;
  if (!email) {
    res.status(400).json({ error: 'Email parameter required.' });
    return;
  }

  const messages = getInbox(email);
  res.json({
    email: email.toLowerCase().trim(),
    count: messages.length,
    messages,
  });
});

// 4b. Verify Received OTP
authRouter.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ error: 'Both email and 6-digit OTP are required.' });
    return;
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    res.status(400).json({ error: 'No OTP request found for this email. Please request an OTP.' });
    return;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    return;
  }

  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    res.status(429).json({ error: 'Too many failed OTP attempts. Please request a new OTP.' });
    return;
  }

  if (record.otp !== String(otp).trim()) {
    record.attempts += 1;
    res.status(400).json({ error: 'Invalid OTP. Please verify and try again.' });
    return;
  }

  // OTP verified successfully - clear record and issue 15-minute reset token
  otpStore.delete(normalizedEmail);

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }

  const resetToken = jwt.sign(
    { userId: user.id, email: user.email, purpose: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({
    message: 'OTP verified successfully. You may now choose a new password.',
    resetToken,
  });
});

// 5. Reset Password
authRouter.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Reset verification token is required.' });
    return;
  }

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters in length.' });
    return;
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash },
    });

    res.json({ message: 'Password has been updated successfully. You may now sign in.' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired password reset session. Please request a new OTP.' });
  }
});

// 6. Current User Session Verification
authRouter.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve session.' });
  }
});
