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
    // Send email
  // Handle both EMAIL_SERVER format and individual EMAIL_HOST/PORT variables
  let transportConfig: any;
  if (process.env.EMAIL_SERVER) {
    // Parse the EMAIL_SERVER string (format: smtp://user:pass@host:port)
    transportConfig = process.env.EMAIL_SERVER;
  } else {
    transportConfig = {
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    };
  }
  
  const transporter = nodemailer.createTransport(transportConfig);
  await transporter.sendMail({
    to: email,
    subject: 'Reset your password',
    text: `Click the link to reset your password: ${process.env.NEXTAUTH_URL}/reset?token=${token}&email=${email}`,
  });
  const res = NextResponse.json({ success: true });
  setRateLimitHeaders(res, rl);
  return res;
  } catch (err: any) {
    const status = err?.status === 400 ? 400 : 500;
    const message = err?.status === 400 ? err.message : 'Server error.';
    const res = NextResponse.json({ error: message }, { status });
    setRateLimitHeaders(res, rl);
    return res;
  }
}
