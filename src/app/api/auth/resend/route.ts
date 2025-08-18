import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { parseJson, schemas } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const rl = rateLimitCheck(req as any, { limit: 10, windowMs: 60_000, route: 'auth_resend' });
  if (!rl.allowed && !rl.shadowed) {
    const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
    setRateLimitHeaders(res, rl);
    return res;
  }
  const { email } = await parseJson(req as any, schemas.authResend);
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
    subject: 'Verify your email',
    text: `Click the link to verify your email: ${process.env.NEXTAUTH_URL}/verify?token=${token}&email=${email}`,
  });
  const res = NextResponse.json({ success: true });
  setRateLimitHeaders(res, rl);
  return res;
}
