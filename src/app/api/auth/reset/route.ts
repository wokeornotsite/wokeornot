import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { parseJson, schemas } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const rl = rateLimitCheck(req as any, { limit: 10, windowMs: 60_000, route: 'auth_reset' });
  if (!rl.allowed && !rl.shadowed) {
    const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
    setRateLimitHeaders(res, rl);
    return res;
  }
  try {
    const { token, email, password } = await parseJson(req as any, schemas.authReset);
    const reset = await prisma.passwordResetToken.findFirst({ where: { token } });
    if (!reset || reset.expires < new Date()) {
      const res = NextResponse.json({ error: 'Reset link expired or invalid.' }, { status: 400 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.id !== reset.userId) {
      const res = NextResponse.json({ error: 'Invalid reset request.' }, { status: 400 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
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
