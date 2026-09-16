/**
 * Email Dispatch Service for Classical Literature Application
 * Decouples OTP delivery from terminal logs and provides in-memory inbox storage for readers.
 */

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

/**
 * Sends a password reset OTP email to the registered reader.
 * Ensures the plaintext OTP is NOT logged to the console/terminal.
 */
export async function sendOtpEmail(toEmail: string, otp: string): Promise<EmailMessage> {
  const normalizedEmail = toEmail.toLowerCase().trim();
  const emailId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const message: EmailMessage = {
    id: emailId,
    to: normalizedEmail,
    from: 'dispatch@athenaeum-literature.org',
    subject: 'Your Athenæum Password Reset OTP Code',
    body: `
Greetings, Reader.

We received a request to reset the password for your Athenæum Reader Account (${normalizedEmail}).

Your One-Time Password (OTP) code is:
=========================
        ${otp}
=========================

This code is valid for 10 minutes. If you did not make this request, you may safely disregard this letter.

Yours in literature,
The Athenæum Registry
    `.trim(),
    otp,
    sentAt: new Date().toISOString(),
  };

  const currentInbox = emailInboxStore.get(normalizedEmail) || [];
  emailInboxStore.set(normalizedEmail, [message, ...currentInbox]);

  // Secure logging: only log recipient and metadata, NEVER the plaintext OTP
  console.log(`[EMAIL DISPATCH] Password Reset email successfully dispatched to ${normalizedEmail} (Message ID: ${emailId})`);

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
