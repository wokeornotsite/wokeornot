import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    let transportConfig: any;
    if (process.env.EMAIL_HOST) {
      transportConfig = {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      };
    } else if (process.env.EMAIL_SERVER) {
      transportConfig = process.env.EMAIL_SERVER;
    } else {
      console.warn('[mailer] No email transport configured — skipping email send');
      return;
    }
    const transporter = nodemailer.createTransport(transportConfig);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[mailer] Failed to send email:', err);
    // Non-throwing — never let email failure break calling code
  }
}
