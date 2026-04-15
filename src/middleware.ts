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
  'facebookbot',
  'bytespider',
];

export async function middleware(req: NextRequest) {
  // Block AI training crawlers before they trigger any page rendering
  const ua = req.headers.get('user-agent')?.toLowerCase() ?? '';
  if (BLOCKED_UA_PATTERNS.some((pattern) => ua.includes(pattern))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Temporary: log user-agent on content detail pages to identify active crawler
  const path = req.nextUrl.pathname;
  if (/^\/(movies|tv-shows|kids)\/\d+/.test(path)) {
    console.log(`[crawler-id] ${ua || '(empty)'} → ${path}`);
  }

  // Only protect /admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|images/|avatars/).*)',
  ],
};
