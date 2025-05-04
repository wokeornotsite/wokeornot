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
  return NextResponse.json({ success: true });
}
