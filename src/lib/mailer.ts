import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[mailer] No RESEND_API_KEY configured — skipping email send');
      return;
    }
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'WokeOrNot <noreply@wokeornot.net>',
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[mailer] Failed to send email:', err);
    // Non-throwing — never let email failure break calling code
  }
}
