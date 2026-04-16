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

// ---------------------------------------------------------------------------
// IP-based rate limiter for content detail pages.
//
// Targets crawlers that rotate user-agent strings (so UA blocking can't catch
// them) but still come from a fixed IP. Threshold is deliberately generous:
//
//   30 content pages per 60 seconds = 1 page every 2 seconds.
//
// A real user reading reviews needs at least 20–30 s per page, so legitimate
// browsing peaks at roughly 2–3 pages/min even when clicking quickly. This
// limit only fires at 10× that rate — well above any human behaviour.
//
// Note: runs in Edge Runtime, so this Map is per-edge-instance. Vercel routes
// requests from the same IP to the same edge PoP, making it effective in
// practice even without a shared store.
// ---------------------------------------------------------------------------
const RATE_LIMIT = 30;          // max content-page hits allowed in the window
const RATE_WINDOW_MS = 60_000;  // 60-second sliding window

const ipTimestamps = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const prev = ipTimestamps.get(ip) ?? [];
  const recent = prev.filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  ipTimestamps.set(ip, recent);

  // Prune fully-expired entries to prevent unbounded memory growth.
  if (ipTimestamps.size > 10_000) {
    for (const [key, times] of ipTimestamps) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) {
        ipTimestamps.delete(key);
      }
    }
  }

  return recent.length > RATE_LIMIT;
}

const CONTENT_PAGE_RE = /^\/(movies|tv-shows|kids)\/\d+/;

export async function middleware(req: NextRequest) {
  // 1. Block known AI training crawlers by user-agent.
  const ua = req.headers.get('user-agent')?.toLowerCase() ?? '';
  if (BLOCKED_UA_PATTERNS.some((pattern) => ua.includes(pattern))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 2. Rate-limit IPs that hammer content pages at crawler speed.
  //    Only applies to /movies/:id, /tv-shows/:id, /kids/:id — not browse or
  //    search pages, which real users legitimately paginate through quickly.
  if (CONTENT_PAGE_RE.test(req.nextUrl.pathname)) {
    // x-forwarded-for is set by Vercel's edge network; first entry is the
    // real client IP even behind multiple proxies.
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    if (isRateLimited(ip)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }
  }

  // 3. Protect /admin routes — non-ADMIN users are redirected to home.
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
