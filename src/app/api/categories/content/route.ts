import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get('categoryId') || '';
  const contentType = req.nextUrl.searchParams.get('contentType') || '';

  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
  }

  try {
    const contents = await prisma.content.findMany({
      where: {
        categoryScores: {
          some: { categoryId },
        },
        ...(contentType ? { contentType: contentType as any } : {}),
      },
      select: { tmdbId: true },
    });

    return NextResponse.json(contents.map(c => c.tmdbId));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch content for category' }, { status: 500 });
  }
}
