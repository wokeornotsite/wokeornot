import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { parseJson, schemas } from '@/lib/validation';

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

  // Guard: fail fast if email is not configured
  if (!process.env.EMAIL_HOST && !process.env.EMAIL_SERVER) {
    const res = NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
    setRateLimitHeaders(res, rl);
    return res;
  }

  try {
    // Individual vars take priority over EMAIL_SERVER URL
    let transportConfig: any;
    if (process.env.EMAIL_HOST) {
      transportConfig = {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      };
    } else {
      transportConfig = process.env.EMAIL_SERVER;
    }

    const transporter = nodemailer.createTransport(transportConfig);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      text: `Click the link to verify your email: ${process.env.NEXTAUTH_URL}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
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
