import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// AI crawlers that generate high server load with no user benefit.
// Keep in sync with public/robots.txt.
const BLOCKED_UA_PATTERNS = [
  'claudebot',
  'anthropic-ai',
  'gptbot',
  'chatgpt-user',
  'google-extended',
  'ccbot',
  'omgili',
  'bytespider',
];

export async function middleware(req: NextRequest) {
  // 1. Block known AI training crawlers by user-agent.
  const ua = req.headers.get('user-agent')?.toLowerCase() ?? '';
  if (BLOCKED_UA_PATTERNS.some((pattern) => ua.includes(pattern))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 2. Protect /admin routes — non-staff users are redirected to home.
  //    Staff = ADMIN or MODERATOR. Page- and API-level guards then enforce
  //    finer-grained capabilities (e.g., bans/deletes are ADMIN-only).
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (token.role !== 'ADMIN' && token.role !== 'MODERATOR')) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|images/|avatars/|api/og).*)',
  ],
};
