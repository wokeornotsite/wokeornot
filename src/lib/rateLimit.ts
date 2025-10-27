import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, getIdentityKey } from './request';
import { log } from './log';

// Simple in-memory sliding window limiter for dev/small scale.
// In production, you should back this with Redis (e.g., Upstash) for multi-instance consistency.

type Bucket = { tokens: number; resetAt: number };
const memoryStore = new Map<string, Bucket>();

export type LimitOptions = {
  limit: number; // max requests per window
  windowMs: number; // window in ms
  key?: string; // override identity key
  shadow?: boolean; // if true, only log would-be blocks
  route?: string; // route label for logs
};

export type LimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset: number; // epoch ms
  shadowed: boolean; // true if would block but shadow mode on
};

export function rateLimitCheck(req: NextRequest, opts: LimitOptions): LimitResult {
  // Enable by default in production, allow disabling via env var
  const explicitlyDisabled = process.env.RATE_LIMIT_ENABLED === '0' || process.env.RATE_LIMIT_ENABLED === 'false';
  const enabled = !explicitlyDisabled && process.env.NODE_ENV === 'production';
  const shadowEnv = process.env.RATE_LIMIT_SHADOW === '1' || process.env.RATE_LIMIT_SHADOW === 'true';
  const shadow = opts.shadow ?? shadowEnv;

  if (!enabled && !shadow) {
    return { allowed: true, remaining: opts.limit, limit: opts.limit, reset: Date.now() + opts.windowMs, shadowed: false };
  }

  const ip = getClientIp(req);
  const key = opts.key || getIdentityKey({ ip });
  const now = Date.now();
  const windowMs = Math.max(1000, opts.windowMs);
  const limit = Math.max(1, opts.limit);

  const bucket = memoryStore.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryStore.set(key, { tokens: limit - 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, limit, reset: now + windowMs, shadowed: false };
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return { allowed: true, remaining: bucket.tokens, limit, reset: bucket.resetAt, shadowed: false };
  }

  // Would block
  const res: LimitResult = { allowed: !enabled, remaining: 0, limit, reset: bucket.resetAt, shadowed: true };
  if (shadow) {
    log.warn('Rate limit shadow block', { key, route: opts.route, resetAt: bucket.resetAt });
    return res;
  }
  return { ...res, allowed: false };
}

export function setRateLimitHeaders(nextRes: NextResponse, result: LimitResult) {
  nextRes.headers.set('X-RateLimit-Limit', String(result.limit));
  nextRes.headers.set('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
  nextRes.headers.set('X-RateLimit-Reset', String(Math.floor(result.reset / 1000)));
  if (!result.allowed) {
    const retryAfterSec = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
    nextRes.headers.set('Retry-After', String(retryAfterSec));
  }
}
