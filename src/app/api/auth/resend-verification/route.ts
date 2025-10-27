import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { parseJson, schemas } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimitCheck(req, { limit: 10, windowMs: 60_000, route: 'auth_resend_verification' });
    if (!rl.allowed && !rl.shadowed) {
      const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
      setRateLimitHeaders(res, rl);
      return res;
    }
    const { email } = await parseJson(req, schemas.authResendVerification);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const res = NextResponse.json({ error: 'User not found.' }, { status: 404 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    if (user.emailVerified) {
      const res = NextResponse.json({ error: 'Email is already verified.' }, { status: 400 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    // Generate a new token
    const token = [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });
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
    const baseUrl = process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
const verifyUrl = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email address',
      html: `<p>Please verify your email address by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
    });
    const res = NextResponse.json({ success: true });
    setRateLimitHeaders(res, rl);
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
