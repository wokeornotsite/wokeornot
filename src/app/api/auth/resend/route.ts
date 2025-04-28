import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'No user with that email.' }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ error: 'Email already verified.' }, { status: 400 });
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });
  // Send email
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
}
