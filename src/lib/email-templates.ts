function wrapInTemplate(title: string, bodyContent: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 20px">
<tr><td align="center">
<table width="100%" style="max-width:560px;background-color:#232946;border-radius:12px;overflow:hidden;border:1px solid rgba(139,92,246,0.2)">
<tr><td style="padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08)">
<span style="font-size:28px;font-weight:800;color:#a855f7">WokeOrNot</span>
</td></tr>
<tr><td style="padding:40px 32px">${bodyContent}</td></tr>
<tr><td style="padding:24px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.08)">
<p style="color:#6b7280;font-size:13px;margin:0">WokeOrNot &bull; <a href="https://wokeornot.net" style="color:#a855f7;text-decoration:none">wokeornot.net</a></p>
<p style="color:#4b5563;font-size:12px;margin:8px 0 0">You received this email because you have an account on WokeOrNot.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

const BTN = 'display:inline-block;background:#7c3aed;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin:24px 0';
const H1 = 'color:#f9fafb;font-size:24px;font-weight:700;margin:0 0 16px 0';
const P = 'color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 12px 0';

export function getVerificationEmailHtml(verificationUrl: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  const body = `
<h1 style="${H1}">Verify Your Email</h1>
<p style="${P}">${greeting}</p>
<p style="${P}">Thanks for joining WokeOrNot! Please verify your email address to activate your account.</p>
<div style="text-align:center"><a href="${verificationUrl}" style="${BTN}">Verify Email Address</a></div>
<p style="${P}">Or copy and paste this link:<br><a href="${verificationUrl}" style="color:#a855f7;word-break:break-all;font-size:13px">${verificationUrl}</a></p>
<p style="color:#6b7280;font-size:13px;margin:16px 0 0">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>`;
  return wrapInTemplate('Verify Your Email', body);
}

export function getPasswordResetEmailHtml(resetUrl: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  const body = `
<h1 style="${H1}">Reset Your Password</h1>
<p style="${P}">${greeting}</p>
<p style="${P}">We received a request to reset your WokeOrNot password. Click the button below to choose a new password.</p>
<div style="text-align:center"><a href="${resetUrl}" style="${BTN}">Reset Password</a></div>
<p style="${P}">Or copy and paste this link:<br><a href="${resetUrl}" style="color:#a855f7;word-break:break-all;font-size:13px">${resetUrl}</a></p>
<p style="color:#ef4444;font-size:13px;font-weight:600;margin:12px 0">This link expires in 1 hour.</p>
<p style="color:#6b7280;font-size:13px;margin:0">If you didn't request a password reset, please ignore this email. Your password will not change.</p>`;
  return wrapInTemplate('Reset Your Password', body);
}

export function getWarnNotificationEmailHtml(userName: string | undefined, warnCount: number, reason?: string, contactUrl?: string): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  const reasonText = reason || 'Violation of community guidelines';
  const contactLink = contactUrl || 'https://wokeornot.net/contact';
  const body = `
<h1 style="${H1}">Account Warning</h1>
<p style="${P}">${greeting}</p>
<p style="${P}">Your account on WokeOrNot has received a warning.</p>
<p style="${P}"><strong style="color:#fbbf24">Reason:</strong> ${reasonText}</p>
<p style="${P}">This is warning <strong style="color:#fbbf24">${warnCount} of 3</strong>. If your account reaches 3 warnings, it will be automatically suspended.</p>
<p style="${P}">If you believe this warning was issued in error, please reach out to us.</p>
<div style="text-align:center"><a href="${contactLink}" style="${BTN}">Contact Us</a></div>
<p style="color:#6b7280;font-size:13px;margin:16px 0 0">Please review our community guidelines to ensure your content meets our standards.</p>`;
  return wrapInTemplate('Account Warning — WokeOrNot', body);
}

export function getBanNotificationEmailHtml(userName: string | undefined, reason?: string, contactUrl?: string): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  const reasonText = reason || 'Violation of community guidelines';
  const contactLink = contactUrl || 'https://wokeornot.net/contact';
  const body = `
<h1 style="${H1}">Account Suspended</h1>
<p style="${P}">${greeting}</p>
<p style="${P}">Your WokeOrNot account has been suspended.</p>
<p style="${P}"><strong style="color:#ef4444">Reason:</strong> ${reasonText}</p>
<p style="${P}">If you believe this action was taken in error, please contact us to appeal.</p>
<div style="text-align:center"><a href="${contactLink}" style="${BTN}">Contact Us to Appeal</a></div>`;
  return wrapInTemplate('Account Suspended — WokeOrNot', body);
}

export function getWelcomeEmailHtml(userName?: string): string {
  const greeting = userName ? `Welcome, ${userName}!` : 'Welcome to WokeOrNot!';
  const body = `
<h1 style="${H1}">${greeting}</h1>
<p style="${P}">Your email has been verified and your account is ready. You can now rate and review movies, TV shows, and kids content.</p>
<p style="${P}">Get started:</p>
<table cellpadding="0" cellspacing="0" style="margin:16px 0">
<tr><td style="padding:8px 0"><a href="https://wokeornot.net/movies" style="color:#a855f7;font-weight:600;text-decoration:none;font-size:15px">&#127916; Browse Movies</a></td></tr>
<tr><td style="padding:8px 0"><a href="https://wokeornot.net/tv-shows" style="color:#a855f7;font-weight:600;text-decoration:none;font-size:15px">&#128250; Browse TV Shows</a></td></tr>
<tr><td style="padding:8px 0"><a href="https://wokeornot.net/kids" style="color:#a855f7;font-weight:600;text-decoration:none;font-size:15px">&#128106; Kids &amp; Family</a></td></tr>
<tr><td style="padding:8px 0"><a href="https://wokeornot.net/profile" style="color:#a855f7;font-weight:600;text-decoration:none;font-size:15px">&#128100; Set Up Your Profile</a></td></tr>
</table>
<div style="text-align:center"><a href="https://wokeornot.net" style="${BTN}">Start Exploring</a></div>`;
  return wrapInTemplate('Welcome to WokeOrNot!', body);
}
