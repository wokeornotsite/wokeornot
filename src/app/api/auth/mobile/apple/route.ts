import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { prisma } from '@/lib/prisma';
import { signMobileToken, formatUserResponse } from '@/lib/mobile-auth';

const APPLE_JWKS_URL = new URL('https://appleid.apple.com/auth/keys');
const appleJWKS = createRemoteJWKSet(APPLE_JWKS_URL);

/**
 * Exchange an Apple Sign-In identity token for an app JWT.
 *
 * Flow:
 * 1. iOS app completes Apple Sign-In → receives identityToken + user info
 * 2. iOS app sends identityToken, fullName, email to this endpoint
 * 3. We verify the identityToken with Apple's public keys
 * 4. Find or create user
 * 5. Return app JWT
 *
 * IMPORTANT: Apple only sends fullName and email on the FIRST sign-in.
 * Subsequent sign-ins only include the identityToken with the `sub` claim.
 * We must persist name/email on first sign-in.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identityToken, fullName, email: providedEmail } = body;

    if (!identityToken) {
      return NextResponse.json({ error: 'Apple identityToken is required' }, { status: 400 });
    }

    // Verify the identity token with Apple's public keys
    let payload;
    try {
      const result = await jwtVerify(identityToken, appleJWKS, {
        issuer: 'https://appleid.apple.com',
      });
      payload = result.payload;
    } catch {
      return NextResponse.json({ error: 'Invalid Apple identity token' }, { status: 401 });
    }

    const appleUserId = payload.sub;
    const tokenEmail = payload.email as string | undefined;
    const email = providedEmail || tokenEmail;

    if (!appleUserId) {
      return NextResponse.json({ error: 'Invalid token: missing subject' }, { status: 401 });
    }

    // Try to find user by Apple account link first
    const existingAccount = await prisma.account.findFirst({
      where: { provider: 'apple', providerAccountId: appleUserId },
    });

    let user;

    if (existingAccount) {
      user = await prisma.user.findUnique({
        where: { id: existingAccount.userId },
        select: { id: true, email: true, name: true, image: true, avatar: true, role: true, isBanned: true },
      });
    }

    // If no linked account, try by email
    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, image: true, avatar: true, role: true, isBanned: true },
      });
    }

    if (user?.isBanned) {
      return NextResponse.json({ error: 'Your account has been suspended' }, { status: 403 });
    }

    // Build display name from Apple's fullName object
    const displayName = fullName
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ') || null
      : null;

    if (!user) {
      if (!email) {
        return NextResponse.json({ error: 'Email is required for first sign-in' }, { status: 400 });
      }
      user = await prisma.user.create({
        data: {
          email,
          name: displayName || email.split('@')[0],
          emailVerified: new Date(),
          role: 'USER',
        },
        select: { id: true, email: true, name: true, image: true, avatar: true, role: true, isBanned: true },
      });
    } else if (displayName && !user.name) {
      // Update name if Apple provided it and user doesn't have one
      await prisma.user.update({
        where: { id: user.id },
        data: { name: displayName },
      });
      user.name = displayName;
    }

    // Ensure Apple account is linked
    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'apple',
          providerAccountId: appleUserId,
          id_token: identityToken,
        },
      });
    }

    const token = await signMobileToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    return NextResponse.json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Mobile Apple auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
