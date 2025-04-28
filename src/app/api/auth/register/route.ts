import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists.' }, { status: 400 });
    }
    // Strong password validation
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters, include a number and an uppercase letter.' }, { status: 400 });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    // Generate verification token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
    await prisma.verificationToken.create({ data: { identifier: email, token, expires } });
    // Send verification email
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      to: email,
      subject: 'Verify your email',
      text: `Click the link to verify your email: ${process.env.NEXTAUTH_URL}/verify?token=${token}&email=${email}`,
    });
    return NextResponse.json({ success: true });
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
