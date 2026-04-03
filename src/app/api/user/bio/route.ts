import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bio } = body;

    if (typeof bio !== 'string') {
      return NextResponse.json({ error: 'Bio must be a string' }, { status: 400 });
    }

    if (bio.length > 300) {
      return NextResponse.json({ error: 'Bio must be 300 characters or fewer' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { bio: bio.trim() || null },
      select: { bio: true },
    });

    return NextResponse.json({ bio: updated.bio });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
