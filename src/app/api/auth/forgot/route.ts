import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'No user with that email.' }, { status: 404 });
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await prisma.passwordResetToken.create({ data: { userId: user.id, token, expires } });
  // Send email
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    to: email,
    subject: 'Reset your password',
    text: `Click the link to reset your password: ${process.env.NEXTAUTH_URL}/reset?token=${token}&email=${email}`,
  });
  return NextResponse.json({ success: true });
}
