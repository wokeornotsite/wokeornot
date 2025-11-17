import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Fetch user's favorites
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST: Add to favorites
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { contentId, contentType, title, posterPath, wokeScore } = body;

    if (!contentId || !contentType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, contentType, title' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_contentId_contentType: {
          userId: user.id,
          contentId: String(contentId),
          contentType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already in favorites', favorite: existing },
        { status: 409 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        contentId: String(contentId),
        contentType,
        title,
        posterPath: posterPath || null,
        wokeScore: wokeScore || null,
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE: Remove from favorites
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'Missing contentId or contentType' },
        { status: 400 }
      );
    }

    await prisma.favorite.delete({
      where: {
        userId_contentId_contentType: {
          userId: user.id,
          contentId,
          contentType,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
