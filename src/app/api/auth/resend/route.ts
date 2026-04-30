import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { parseJson, schemas } from '@/lib/validation';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const rl = rateLimitCheck(req, { limit: 10, windowMs: 60_000, route: 'auth_resend' });
  if (!rl.allowed && !rl.shadowed) {
    const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
    setRateLimitHeaders(res, rl);
    return res;
  }
  const { email } = await parseJson(req, schemas.authResend);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const res = NextResponse.json({ error: 'No user with that email.' }, { status: 404 });
    setRateLimitHeaders(res, rl);
    return res;
  }
  if (user.emailVerified) {
    const res = NextResponse.json({ error: 'Email already verified.' }, { status: 400 });
    setRateLimitHeaders(res, rl);
    return res;
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  try {
    await sendEmail({
      to: email,
      subject: 'Verify your email',
      html: `<p>Click the link to verify your email: <a href="${process.env.NEXTAUTH_URL}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}">Verify email</a></p>`,
    });
    const res = NextResponse.json({ success: true });
    setRateLimitHeaders(res, rl);
    return res;
  } catch (err: any) {
    console.error('[resend] email error:', err);
    const res = NextResponse.json({ error: 'Server error.' }, { status: 500 });
    setRateLimitHeaders(res, rl);
    return res;
  }
}
