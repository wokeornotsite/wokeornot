import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAPI } from '@/lib/admin-auth';

/**
 * GET /api/admin/movies
 * Returns all content (movies, TV shows, kids content) for admin management
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '0');
    const pageSize = Math.min(Number(searchParams.get('pageSize') || '50'), 100);
    const contentType = searchParams.get('contentType') || '';
    const q = searchParams.get('q')?.trim() || '';

    // Build where clause
    const where: any = {};
    if (contentType) where.contentType = contentType;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { overview: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.content.findMany({
        where,
        select: {
          id: true,
          title: true,
          contentType: true,
          releaseDate: true,
          wokeScore: true,
          reviewCount: true,
          posterPath: true,
          tmdbId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.content.count({ where }),
    ]);

    // Format data for DataGrid (add 'year' field for backwards compatibility)
    const formattedData = data.map((item) => ({
      id: item.id,
      title: item.title,
      year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : null,
      contentType: item.contentType,
      wokeScore: item.wokeScore,
      reviewCount: item.reviewCount,
      posterPath: item.posterPath,
      tmdbId: item.tmdbId,
      createdAt: item.createdAt,
    }));

    return NextResponse.json({ data: formattedData, total });
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/movies
 * Deletes a content item by ID
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID required' },
        { status: 400 }
      );
    }

    // Delete the content (cascade will handle reviews, comments, etc.)
    await prisma.content.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
