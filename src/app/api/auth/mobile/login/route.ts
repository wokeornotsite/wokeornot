import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { signMobileToken, formatUserResponse } from '@/lib/mobile-auth';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimitCheck(req, { limit: 10, windowMs: 60_000, route: 'mobile_login' });
    if (!rl.allowed && !rl.shadowed) {
      const res = NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
      setRateLimitHeaders(res, rl);
      return res;
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true, image: true, avatar: true, role: true, password: true, emailVerified: true, isBanned: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Your account has been suspended' }, { status: 403 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: 'Please verify your email address before logging in' }, { status: 403 });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signMobileToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    const res = NextResponse.json({
      token,
      user: formatUserResponse(user),
    });
    setRateLimitHeaders(res, rl);
    return res;
  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
