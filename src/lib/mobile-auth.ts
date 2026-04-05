import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
const JWT_EXPIRY = '30d';

export interface MobileTokenPayload {
  sub: string;       // user ID
  email: string;
  name: string | null;
  role: string;
}

/**
 * Sign a JWT for mobile clients using jose (Edge-compatible).
 */
export async function signMobileToken(user: { id: string; email: string; name: string | null; role: string }): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verify a mobile JWT and return the payload.
 * Returns null if the token is invalid or expired.
 */
export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: payload.email as string,
      name: (payload.name as string | null) ?? null,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Get user from a Bearer token. Returns the user record or null.
 */
export async function getUserFromBearerToken(authHeader: string | null) {
  const token = extractBearerToken(authHeader);
  if (!token) return null;

  const payload = await verifyMobileToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, image: true, avatar: true, role: true, isBanned: true },
  });

  if (!user || user.isBanned) return null;
  return user;
}

/**
 * Get the authenticated user from either NextAuth session (cookies) or Bearer token.
 * This enables both web and mobile clients to use the same API routes.
 */
export async function getAuthUser(req: Request) {
  // First try Bearer token (mobile)
  const authHeader = req.headers.get('authorization');
  const mobileUser = await getUserFromBearerToken(authHeader);
  if (mobileUser) return mobileUser;

  // Fallback to NextAuth session (web) — dynamic import to avoid circular deps
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('./auth');
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, image: true, avatar: true, role: true, isBanned: true },
  });

  if (!user || user.isBanned) return null;
  return user;
}

/**
 * Format a user object into the standard response shape for mobile clients.
 */
export function formatUserResponse(user: { id: string; email: string; name: string | null; image: string | null; avatar: string | null; role: string }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    avatar: user.avatar,
    role: user.role,
  };
}
