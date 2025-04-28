import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const email = req.nextUrl.searchParams.get('email');
  if (!token || !email) {
    return NextResponse.json({ error: 'Invalid verification link.' }, { status: 400 });
  }
  const verification = await prisma.verificationToken.findFirst({ where: { identifier: email, token } });
  if (!verification || verification.expires < new Date()) {
    return NextResponse.json({ error: 'Verification link expired or invalid.' }, { status: 400 });
  }
  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();
    if (!token || !email) {
      return NextResponse.json({ error: 'Invalid verification request.' }, { status: 400 });
    }
    const verification = await prisma.verificationToken.findFirst({ where: { identifier: email, token } });
    if (!verification || verification.expires < new Date()) {
      return NextResponse.json({ error: 'Verification link expired or invalid.' }, { status: 400 });
    }
    await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
