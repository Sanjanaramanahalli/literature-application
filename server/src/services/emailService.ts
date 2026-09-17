/**
 * Email Dispatch Service for Classical Literature Application
 * Decouples OTP delivery from terminal logs and delivers real emails via Nodemailer (SMTP / Ethereal).
 */
import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailMessage {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  otp: string;
  sentAt: string;
}

// In-memory inbox store: email address -> array of EmailMessages (most recent first)
const emailInboxStore = new Map<string, EmailMessage[]>();

// Cached transporter
let transporter: Transporter | null = null;

export async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  const gmailUser = (process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  // 1. Direct Gmail Transporter via GMAIL_USER and GMAIL_APP_PASSWORD (or EMAIL_USER / EMAIL_PASSWORD)
  if (gmailUser && gmailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    console.log(`[EMAIL SERVICE] Connected to Gmail SMTP Gateway (${gmailUser})`);
    return transporter;
  }

  // 2. Custom Standard SMTP Configuration
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    console.log(`[EMAIL SERVICE] Connected to Custom SMTP Host (${smtpHost}:${smtpPort})`);
    return transporter;
  }

  // 3. If in production, do NOT quietly fall back to a mock stream or Ethereal
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Production email service is not configured. Missing GMAIL_USER/GMAIL_APP_PASSWORD or SMTP credentials.');
  }

  // 4. Local Development Fallback: In-memory stream transport
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows',
  });
  console.log('[EMAIL SERVICE] Initialized local development in-memory email dispatcher');

  return transporter;
}

/**
 * Sends a password reset OTP email to the registered reader.
 * Ensures the plaintext OTP is NOT logged to the console/terminal.
 */
export async function sendOtpEmail(toEmail: string, otp: string): Promise<EmailMessage> {
  const normalizedEmail = toEmail.toLowerCase().trim();
  const emailId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sender = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.GMAIL_USER || '"Classic Literature" <sanjanalr8@gmail.com>';

  const subject = 'Password Reset OTP';
  const textBody = `Hello,

Your password reset OTP is: ${otp}

This OTP will expire after 10 minutes.

If you did not request a password reset, please ignore this email.

Regards,
Literature Application Team`.trim();

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #E5DFD5; background: #FDFBF7; color: #2C2623; border-radius: 8px;">
      <h2 style="color: #6B1D2F; margin-top: 0; font-weight: normal; border-bottom: 1px solid #EAE3D9; padding-bottom: 12px;">Literature Application Team</h2>
      <p style="font-size: 15px; line-height: 1.6;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.6;">Your password reset OTP is:</p>
      
      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; padding: 14px 28px; background: #FAF7F2; border: 2px dashed #6B1D2F; border-radius: 6px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #6B1D2F; font-family: monospace;">
          ${otp}
        </div>
      </div>

      <p style="font-size: 13px; color: #736B63; line-height: 1.5;">This OTP will expire after 10 minutes. If you did not request a password reset, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #EAE3D9; margin: 24px 0 16px;" />
      <p style="font-size: 12px; color: #8C827A; text-align: center; margin: 0;">Regards,<br>Literature Application Team</p>
    </div>
  `;

  // Attempt real delivery
  const mailer = await getTransporter();
  await mailer.sendMail({
    from: sender,
    to: normalizedEmail,
    subject,
    text: textBody,
    html: htmlBody,
  });

  console.log('[EMAIL DISPATCH] Password reset OTP email successfully dispatched to registered email');

  const message: EmailMessage = {
    id: emailId,
    to: normalizedEmail,
    from: sender,
    subject,
    body: textBody,
    otp,
    sentAt: new Date().toISOString(),
  };

  // Only keep in-app inbox in non-production
  if (process.env.NODE_ENV !== 'production') {
    const currentInbox = emailInboxStore.get(normalizedEmail) || [];
    emailInboxStore.set(normalizedEmail, [message, ...currentInbox]);
  }

  return message;
}

/**
 * Retrieves the simulated inbox for a given reader email address.
 */
export function getInbox(toEmail: string): EmailMessage[] {
  const normalizedEmail = toEmail.toLowerCase().trim();
  return emailInboxStore.get(normalizedEmail) || [];
}

/**
 * Clears the inbox for testing purposes.
 */
export function clearInbox(toEmail?: string): void {
  if (toEmail) {
    emailInboxStore.delete(toEmail.toLowerCase().trim());
  } else {
    emailInboxStore.clear();
  }
}
