import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const { token, email, password } = await req.json();
  if (!token || !email || !password) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const reset = await prisma.passwordResetToken.findFirst({ where: { token } });
  if (!reset || reset.expires < new Date()) {
    return NextResponse.json({ error: 'Reset link expired or invalid.' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.id !== reset.userId) {
    return NextResponse.json({ error: 'Invalid reset request.' }, { status: 400 });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ success: true });
}
