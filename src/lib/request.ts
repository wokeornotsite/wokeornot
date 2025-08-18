import { NextRequest } from 'next/server';

export type ClientIdentity = {
  ip: string;
  userId?: string | null;
};

export function getClientIp(req: NextRequest): string {
  // Try common headers in order
  const h = req.headers;
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  const cf = h.get('cf-connecting-ip');
  if (cf) return cf;
  const nf = h.get('x-nf-client-connection-ip');
  if (nf) return nf;
  const xr = h.get('x-real-ip');
  if (xr) return xr;
  // Last resort: remote address not exposed, fallback to loopback marker
  return '0.0.0.0';
}

export function getIdentityKey({ ip, userId }: ClientIdentity): string {
  return userId ? `uid:${userId}` : `ip:${ip}`;
}
