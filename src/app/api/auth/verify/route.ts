import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { parseJson, schemas } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const rl = rateLimitCheck(req as any, { limit: 20, windowMs: 60_000, route: 'auth_verify_get' });
  if (!rl.allowed && !rl.shadowed) {
    const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
    setRateLimitHeaders(res, rl);
    return res;
  }
  const token = req.nextUrl.searchParams.get('token');
  const email = req.nextUrl.searchParams.get('email');
  if (!token || !email) {
    const res = NextResponse.json({ error: 'Invalid verification link.' }, { status: 400 });
    setRateLimitHeaders(res, rl);
    return res;
  }
  const verification = await prisma.verificationToken.findFirst({ where: { identifier: email, token } });
  if (!verification || verification.expires < new Date()) {
    const res = NextResponse.json({ error: 'Verification link expired or invalid.' }, { status: 400 });
    setRateLimitHeaders(res, rl);
    return res;
  }
  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  const res = NextResponse.json({ success: true });
  setRateLimitHeaders(res, rl);
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimitCheck(req as any, { limit: 10, windowMs: 60_000, route: 'auth_verify_post' });
    if (!rl.allowed && !rl.shadowed) {
      const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
      setRateLimitHeaders(res, rl);
      return res;
    }
    const { token, email } = await parseJson(req as any, schemas.authVerifyPost);
    const verification = await prisma.verificationToken.findFirst({ where: { identifier: email, token } });
    if (!verification || verification.expires < new Date()) {
      const res = NextResponse.json({ error: 'Verification link expired or invalid.' }, { status: 400 });
      setRateLimitHeaders(res, rl);
      return res;
    }
    await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    const res = NextResponse.json({ success: true });
    setRateLimitHeaders(res, rl);
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
