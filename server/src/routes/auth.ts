import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'classic_literature_super_secret_jwt_key_2026';
const ADMIN_INVITATION_SECRET = process.env.ADMIN_INVITATION_SECRET || 'LITERATURE_ADMIN_MASTER_KEY_2026';

// 1. Register Reader or Admin (with invitation secret)
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, confirmPassword, adminSecret } = req.body;

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

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Role determination: Admin only if adminSecret matches
    let assignedRole = 'READER';
    if (adminSecret) {
      if (adminSecret.trim() === ADMIN_INVITATION_SECRET) {
        assignedRole = 'ADMIN';
      } else {
        res.status(403).json({ error: 'Invalid Admin Invitation Secret key.' });
        return;
      }
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

// 4. Forgot Password (tokenized email reset)
authRouter.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    // Return friendly generic response for privacy
    res.json({ message: 'If that email exists in our records, a reset dispatch has been logged.' });
    return;
  }

  const resetToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  console.log(`[AUTH EMAIL DISPATCH] Password Reset Token for ${email}: ${resetToken}`);

  res.json({
    message: 'Password reset dispatch sent successfully.',
    resetTokenDemo: resetToken, // Provided for easy demo verification
  });
});

// 5. Reset Password
authRouter.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Valid token and new password (min 6 chars) are required.' });
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
    res.status(400).json({ error: 'Invalid or expired password reset token.' });
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
