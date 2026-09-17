import {
  sendGmailEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendWorkshopEmail,
  sendHackathonEmail,
  sendAdminAnnouncementEmail,
  sendBulkAnnouncementEmails,
  isGmailConfigured,
  getGmailFromAddress,
  type GmailMailOptions as SendMailOptions,
  type EmailSendResult as SendMailResult,
} from '../services/emailService';
import { env, CLUB } from '../config/env';
import { isResendConfigured, getResendFromEmail } from '../services/email/resend';
import { safeString } from '../utils/safe';

export {
  sendGmailEmail as sendEmail,
  sendGmailEmail as sendMail,
  sendOTPEmail,
  sendOTPEmail as sendOtpEmail,
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendWorkshopEmail,
  sendHackathonEmail,
  sendAdminAnnouncementEmail,
  sendBulkAnnouncementEmails,
  isGmailConfigured as isEmailConfigured,
  isGmailConfigured as emailIsConfigured,
  getGmailFromAddress as getResendSender,
  getGmailFromAddress,
  type SendMailOptions,
  type SendMailResult,
};

export const sendThankYouEmail = sendWelcomeEmail;

/** Send single event email */
export async function sendEventEmail(opts: {
  to: string;
  studentName: string;
  event: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    poster?: string;
    registrationLink?: string;
  };
}): Promise<SendMailResult> {
  return sendAdminAnnouncementEmail({
    to: opts.to,
    studentName: opts.studentName,
    title: opts.event.title,
    description: opts.event.description,
    date: opts.event.date,
    time: opts.event.time,
    venue: opts.event.venue,
    posterUrl: opts.event.poster,
    registrationLink: opts.event.registrationLink,
    subject: `You're Invited! ${opts.event.title} – ${CLUB.name}`,
  });
}

/** Bulk event registration emails */
export async function sendBulkEventRegistrationEmails(opts: {
  recipients: Array<{ email: string; name: string }>;
  event: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    poster?: string;
    registrationLink?: string;
  };
  batchSize?: number;
  delayMs?: number;
}) {
  return sendBulkAnnouncementEmails({
    recipients: opts.recipients,
    title: opts.event.title,
    description: opts.event.description,
    date: opts.event.date,
    time: opts.event.time,
    venue: opts.event.venue,
    posterUrl: opts.event.poster,
    registrationLink: opts.event.registrationLink,
    subject: `You're Invited! ${opts.event.title} – ${CLUB.name}`,
    batchSize: opts.batchSize,
    delayMs: opts.delayMs,
  });
}

/** Public config status safe to return to client/admin UI */
export function getEmailConfigStatus() {
  const gmail = isGmailConfigured();
  // `isResendConfigured()` is false for the @resend.dev sandbox sender, which
  // can only deliver to the account owner — so it is never a usable provider.
  const resendUsable = isResendConfigured();
  const provider = resendUsable ? 'resend' : gmail ? 'gmail' : 'none';
  const resendFrom = getResendFromEmail();

  return {
    configured: resendUsable || gmail,
    /** Effective provider used by the dispatcher (auto: Resend → Gmail fallback). */
    provider,
    hasApiKey: Boolean(env.resendApiKey),
    hasUser: Boolean(env.gmail.user),
    hasFromEmail: Boolean(resendFrom || env.gmail.user),
    hasAppPassword: Boolean(env.gmail.appPassword),
    /** Resend is usable only with an API key AND a non-sandbox sender. */
    resendSenderConfigured: resendUsable,
    resendFromEmail: resendFrom || '',
    gmailAvailable: gmail,
    adminEmail: env.contactRecipientEmail || env.siteEmail,
    fromEmail: provider === 'resend' ? resendFrom : env.gmail.user || '',
  };
}

export function escapeHtml(value: unknown): string {
  return safeString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Resend-compatible shim for legacy call-sites.
 * Backed by Nodemailer/Gmail SMTP — normal website emails never touch Resend.
 */
export function getResendCompatibleMailer() {
  return {
    emails: {
      send: async (msg: {
        from?: string;
        to?: string;
        replyTo?: string;
        subject?: string;
        html?: string;
        text?: string;
        attachments?: Array<{ filename: string; content: Buffer | string }>;
      }): Promise<{ data?: { id: string } | null; error?: { message: string } | null }> => {
        const result = await sendGmailEmail({
          to: msg.to || '',
          subject: msg.subject || '',
          html: msg.html || '',
          text: msg.text,
          replyTo: msg.replyTo,
          attachments: msg.attachments,
        });
        if (result.success) {
          return { data: { id: result.id || '' }, error: null };
        }
        return { data: null, error: { message: result.error || 'Email send failed.' } };
      },
    },
  };
}

export type ResendCompatibleMailer = ReturnType<typeof getResendCompatibleMailer>;