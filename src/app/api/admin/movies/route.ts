import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAPI, requireStaffAPI } from '@/lib/admin-auth';
import { writeAuditLog } from '@/lib/audit';
import { z } from 'zod';

/**
 * GET /api/admin/movies
 * Returns all content (movies, TV shows, kids content) for admin management
 */
export async function GET(req: NextRequest) {
  const auth = await requireStaffAPI();
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
          overview: true,
          contentType: true,
          releaseDate: true,
          wokeScore: true,
          reviewCount: true,
          posterPath: true,
          backdropPath: true,
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
      overview: item.overview,
      year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : null,
      releaseDate: item.releaseDate,
      contentType: item.contentType,
      wokeScore: item.wokeScore,
      reviewCount: item.reviewCount,
      posterPath: item.posterPath,
      backdropPath: item.backdropPath,
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
    const body = await req.json();

    // Support both single { id } and bulk { ids: [...] }
    const objectIdHex = /^[a-f\d]{24}$/i;
    const ids: string[] = body.ids ?? (body.id ? [body.id] : []);
    const validIds = ids.filter((id: string) => objectIdHex.test(id));

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid content ID required' },
        { status: 400 }
      );
    }

    // Read titles for the audit detail before deletion (best-effort).
    const snapshots = await prisma.content.findMany({
      where: { id: { in: validIds } },
      select: { id: true, title: true },
    });
    const titleById = new Map(snapshots.map((s) => [s.id, s.title]));

    // Delete the content items (cascade handles reviews, comments, etc.)
    await prisma.content.deleteMany({
      where: { id: { in: validIds } },
    });

    await Promise.all(
      validIds.map((id) =>
        writeAuditLog({
          adminId: auth.session.user.id,
          action: 'DELETE_CONTENT',
          targetId: id,
          targetType: 'Content',
          details: titleById.get(id) ?? undefined,
        })
      )
    );

    return NextResponse.json({ success: true, deleted: validIds.length });
  } catch (error) {
    console.error('Failed to delete content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/movies
 * Edit content metadata (title, overview, poster/backdrop paths, release date).
 * Note: wokeScore is derived from reviews and intentionally not editable here —
 * a manual override would be overwritten by the next rating.
 */
const PatchContentSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid content id'),
  title: z.string().trim().min(1).max(300).optional(),
  overview: z.string().trim().max(5000).optional(),
  posterPath: z.string().trim().max(500).nullable().optional(),
  backdropPath: z.string().trim().max(500).nullable().optional(),
  releaseDate: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const parsed = PatchContentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { id, title, overview, posterPath, backdropPath, releaseDate } = parsed.data;

    const data: any = {};
    if (typeof title === 'string') data.title = title;
    if (typeof overview === 'string') data.overview = overview;
    if (typeof posterPath !== 'undefined') data.posterPath = posterPath;
    if (typeof backdropPath !== 'undefined') data.backdropPath = backdropPath;
    if (typeof releaseDate !== 'undefined') {
      data.releaseDate = releaseDate ? new Date(releaseDate) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
    }

    const updated = await prisma.content.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        overview: true,
        posterPath: true,
        backdropPath: true,
        releaseDate: true,
        contentType: true,
        wokeScore: true,
        reviewCount: true,
        tmdbId: true,
      },
    });

    await writeAuditLog({
      adminId: auth.session.user.id,
      action: 'EDIT_CONTENT',
      targetId: id,
      targetType: 'Content',
      details: `Edited ${Object.keys(data).join(', ')}`,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to update content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
