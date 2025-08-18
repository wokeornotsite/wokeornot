import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { parseJson, schemas, sanitizeHTML } from '@/lib/validation';
import { error as httpError } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimitCheck(req as any, { limit: 5, windowMs: 60_000, route: 'auth_register' });
    if (!rl.allowed && !rl.shadowed) {
      const res = NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    const { name, email, password } = await parseJson(req as any, schemas.authRegister);
    const safeName = name ? sanitizeHTML(name) : '';
    if (!email || !password) {
      const res = NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const res = NextResponse.json({ error: 'User already exists.' }, { status: 400 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    // Strong password validation
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      const res = NextResponse.json({ error: 'Password must be at least 8 characters, include a number and an uppercase letter.' }, { status: 400 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const user = await prisma.user.create({
      data: {
        name: safeName,
        email,
        password: hashedPassword,
      },
    });
    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
    await prisma.verificationToken.create({ data: { identifier: email, token, expires } });
    // Send verification email
    const nodemailer = await import('nodemailer');
    
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
  } catch (error: unknown) {
    let message = 'Registration failed.';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    const res = NextResponse.json({ error: message }, { status: 500 });
    // no rl here if exception before initialized
    return res;
  }
}
