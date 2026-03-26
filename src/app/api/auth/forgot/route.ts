import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { parseJson, schemas } from '@/lib/validation';

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
      const res = NextResponse.json({ error: 'No user with that email.' }, { status: 404 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expires } });
    // Guard: fail fast if email is not configured
    if (!process.env.EMAIL_HOST && !process.env.EMAIL_SERVER) {
      const res = NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    // Send email — individual vars take priority over EMAIL_SERVER URL
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
      subject: 'Reset your password',
      text: `Click the link to reset your password: ${process.env.NEXTAUTH_URL}/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
    });
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
