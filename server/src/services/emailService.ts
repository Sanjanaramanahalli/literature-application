/**
 * Email Dispatch Service for Classical Literature Application
 * Decouples OTP delivery from terminal logs and delivers real emails via Nodemailer (SMTP / Ethereal).
 */
import nodemailer from 'nodemailer';

export interface EmailMessage {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  otp: string;
  sentAt: string;
  previewUrl?: string | false;
}

// In-memory inbox store: email address -> array of EmailMessages (most recent first)
const emailInboxStore = new Map<string, EmailMessage[]>();

// Cached transporter
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  // 1. If custom SMTP configured in environment
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // 2. Fallback: Automatically create test ethereal account (real internet email testing with web inbox)
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[EMAIL SERVICE] Connected to real email testing gateway (Ethereal: ${testAccount.user})`);
  } catch (err) {
    console.warn('[EMAIL SERVICE] Ethereal initialization fallback. Using stream transport.', err);
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows',
    });
  }

  return transporter;
}

/**
 * Sends a password reset OTP email to the registered reader.
 * Ensures the plaintext OTP is NOT logged to the console/terminal.
 */
export async function sendOtpEmail(toEmail: string, otp: string): Promise<EmailMessage> {
  const normalizedEmail = toEmail.toLowerCase().trim();
  const emailId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sender = process.env.SMTP_FROM || '"Athenæum Sanctuary" <dispatch@athenaeum-literature.org>';

  const subject = 'Your Athenæum Password Reset OTP Code';
  const textBody = `
Greetings, Reader.

We received a request to reset the password for your Athenæum Reader Account (${normalizedEmail}).

Your One-Time Password (OTP) code is:
=========================
        ${otp}
=========================

This code is valid for 10 minutes. If you did not make this request, you may safely disregard this letter.

Yours in literature,
The Athenæum Registry
  `.trim();

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #E5DFD5; background: #FDFBF7; color: #2C2623; border-radius: 8px;">
      <h2 style="color: #6B1D2F; margin-top: 0; font-weight: normal; border-bottom: 1px solid #EAE3D9; padding-bottom: 12px;">The Athenæum Registry</h2>
      <p style="font-size: 15px; line-height: 1.6;">Greetings, Reader.</p>
      <p style="font-size: 15px; line-height: 1.6;">We received a request to reset the password for your reader account associated with <strong>${normalizedEmail}</strong>.</p>
      
      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; padding: 14px 28px; background: #FAF7F2; border: 2px dashed #6B1D2F; border-radius: 6px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #6B1D2F; font-family: monospace;">
          ${otp}
        </div>
      </div>

      <p style="font-size: 13px; color: #736B63; line-height: 1.5;">This OTP code remains valid for <strong>10 minutes</strong>. If you did not solicit this security letter, you may safely ignore it.</p>
      <hr style="border: none; border-top: 1px solid #EAE3D9; margin: 24px 0 16px;" />
      <p style="font-size: 12px; color: #8C827A; text-align: center; margin: 0;">Preserving timeless scholarship and classic literature.</p>
    </div>
  `;

  let previewUrl: string | false = false;

  try {
    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: sender,
      to: normalizedEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL DISPATCH] Real email preview link for ${normalizedEmail}: ${previewUrl}`);
    } else {
      console.log(`[EMAIL DISPATCH] Password Reset email successfully dispatched to ${normalizedEmail} via SMTP`);
    }
  } catch (err) {
    console.error(`[EMAIL DISPATCH ERROR] Failed to send email via SMTP to ${normalizedEmail}:`, err);
  }

  const message: EmailMessage = {
    id: emailId,
    to: normalizedEmail,
    from: sender,
    subject,
    body: textBody,
    otp,
    sentAt: new Date().toISOString(),
    previewUrl,
  };

  const currentInbox = emailInboxStore.get(normalizedEmail) || [];
  emailInboxStore.set(normalizedEmail, [message, ...currentInbox]);

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
