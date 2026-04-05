import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signMobileToken, formatUserResponse } from '@/lib/mobile-auth';

/**
 * Exchange a Google OAuth id_token (from Google Sign-In iOS SDK) for an app JWT.
 *
 * Flow:
 * 1. iOS app completes Google Sign-In → receives id_token
 * 2. iOS app sends id_token to this endpoint
 * 3. We verify with Google's tokeninfo endpoint
 * 4. Find or create user
 * 5. Return app JWT
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'Google id_token is required' }, { status: 400 });
    }

    // Verify the id_token with Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!googleRes.ok) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const googleUser = await googleRes.json();
    const { email, name, picture, sub: googleId } = googleUser;

    if (!email) {
      return NextResponse.json({ error: 'Google account does not have an email' }, { status: 400 });
    }

    // Verify the token was issued for our app
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && googleUser.aud !== clientId && googleUser.aud !== process.env.GOOGLE_IOS_CLIENT_ID) {
      return NextResponse.json({ error: 'Token not issued for this application' }, { status: 401 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, image: true, avatar: true, role: true, isBanned: true },
    });

    if (user?.isBanned) {
      return NextResponse.json({ error: 'Your account has been suspended' }, { status: 403 });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          image: picture || null,
          emailVerified: new Date(),
          role: 'USER',
        },
        select: { id: true, email: true, name: true, image: true, avatar: true, role: true, isBanned: true },
      });
    }

    // Ensure Google account is linked
    const existingAccount = await prisma.account.findFirst({
      where: { userId: user.id, provider: 'google' },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleId,
        },
      });
    }

    const token = await signMobileToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    return NextResponse.json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Mobile Google auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
