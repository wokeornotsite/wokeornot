import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAPI } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '0'); // 0-based
    const pageSize = Math.min(Number(searchParams.get('pageSize') || '10'), 100);
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'rating';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const q = searchParams.get('q')?.trim() || '';
    const contentType = searchParams.get('contentType') || '';

    const objectIdHex = /^[a-f\d]{24}$/i;

    // Build review where without relation filters
    const whereReviews: any = {};
    if (q) {
      whereReviews.OR = [
        { text: { contains: q, mode: 'insensitive' } },
        { guestName: { contains: q, mode: 'insensitive' } },
      ];
    }

    // If q should also match user email/name, resolve user IDs first
    if (q) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
        take: 200,
      });
      if (users.length) {
        whereReviews.OR = [
          ...(whereReviews.OR || []),
          { userId: { in: users.map(u => u.id) } },
        ];
      }
    }

    // Resolve content constraints (contentType and q on content title) to content IDs
    if (q || contentType) {
      const contentWhere: any = {};
      if (q) contentWhere.title = { contains: q, mode: 'insensitive' };
      if (contentType) contentWhere.contentType = contentType;
      const contents = await prisma.content.findMany({ where: contentWhere, select: { id: true }, take: 500 });
      if (contents.length || contentType) {
        whereReviews.contentId = { in: contents.map(c => c.id).filter(id => objectIdHex.test(id)) };
      }
    }

    const [base, total] = await Promise.all([
      prisma.review.findMany({
        where: whereReviews,
        select: {
          id: true,
          text: true,
          rating: true,
          createdAt: true,
          guestName: true,
          user: { select: { email: true, name: true } },
          contentId: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.review.count({ where: whereReviews }),
    ]);

    // Safely join content by fetching only valid ObjectId-like ids
    const validIds = Array.from(new Set(base.map(r => r.contentId).filter((id): id is string => Boolean(id) && objectIdHex.test(id as string))));
    const contents = validIds.length
      ? await prisma.content.findMany({ where: { id: { in: validIds } }, select: { id: true, title: true, contentType: true } })
      : [];
    const contentMap = new Map(contents.map(c => [c.id, { title: c.title, contentType: c.contentType }]));

    const data = base.map(r => ({
      id: r.id,
      text: r.text,
      rating: r.rating,
      createdAt: r.createdAt,
      guestName: r.guestName,
      user: r.user,
      content: contentMap.get(r.contentId) ?? null,
    }));

    return NextResponse.json({ data, total });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    const { id, text, rating } = body as { id?: string; text?: string | null; rating?: number };
    if (!id) return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    const data: any = {};
    if (typeof text !== 'undefined') data.text = text;
    if (typeof rating === 'number') data.rating = rating;
    const updated = await prisma.review.update({ where: { id }, data });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
