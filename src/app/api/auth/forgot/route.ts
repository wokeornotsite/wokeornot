import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { parseJson, schemas } from '@/lib/validation';
import { getPasswordResetEmailHtml } from '@/lib/email-templates';
import { getPostHogClient } from '@/lib/posthog-server';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const rl = rateLimitCheck(req, { limit: 10, windowMs: 60_000, route: 'auth_forgot' });
  if (!rl.allowed && !rl.shadowed) {
    const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
    setRateLimitHeaders(res, rl);
    return res;
  }
  try {
    const { email } = await parseJson(req, schemas.authForgot);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const res = NextResponse.json({ message: 'If an account with that email exists, you will receive a reset link.' });
      setRateLimitHeaders(res, rl);
      return res;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expires } });
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: email,
      subject: 'Reset your password',
      html: getPasswordResetEmailHtml(resetUrl, user.name || undefined),
    });
    try { getPostHogClient().capture({ distinctId: user.id, event: 'password_reset_requested', properties: { email } }); } catch {}
    const res = NextResponse.json({ success: true });
    setRateLimitHeaders(res, rl);
    return res;
  } catch (err: any) {
    console.error('[forgot] email error code:', err?.code);
    console.error('[forgot] email error message:', err?.message);
    console.error('[forgot] email error response:', err?.response);
    const status = err?.status === 400 ? 400 : 500;
    const message = err?.status === 400 ? err.message : 'Server error.';
    const res = NextResponse.json({ error: message }, { status });
    setRateLimitHeaders(res, rl);
    return res;
  }
}
