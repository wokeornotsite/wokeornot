import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffAPI } from '@/lib/admin-auth';
import { writeAuditLog } from '@/lib/audit';
import { recalculateContentScores } from '@/lib/recalculate-content-scores';

export async function GET(req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '0'); // 0-based
    const pageSize = Math.min(Number(searchParams.get('pageSize') || '10'), 100);
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'rating';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const q = searchParams.get('q')?.trim() || '';
    const contentType = searchParams.get('contentType') || '';
    const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
    const maxRating = searchParams.get('maxRating') ? Number(searchParams.get('maxRating')) : undefined;
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const ipHashFilter = searchParams.get('ipHash')?.trim() || '';
    const guestOnly = searchParams.get('guestOnly') === '1';

    const objectIdHex = /^[a-f\d]{24}$/i;

    // Build review where without relation filters
    const whereReviews: any = {};

    if (typeof minRating === 'number' && !isNaN(minRating)) whereReviews.rating = { ...whereReviews.rating, gte: minRating };
    if (typeof maxRating === 'number' && !isNaN(maxRating)) whereReviews.rating = { ...whereReviews.rating, lte: maxRating };
    if (dateFrom) whereReviews.createdAt = { ...whereReviews.createdAt, gte: new Date(dateFrom) };
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      whereReviews.createdAt = { ...whereReviews.createdAt, lte: end };
    }
    if (ipHashFilter) whereReviews.ipHash = ipHashFilter;
    if (guestOnly) whereReviews.userId = null;

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
        whereReviews.contentId = { in: contents.map(c => c.id).filter((id: string) => objectIdHex.test(id)) };
      }
    }

    const [base, total] = await Promise.all([
      prisma.review.findMany({
        where: whereReviews,
        select: {
          id: true,
          text: true,
          rating: true,
          isHidden: true,
          hideReason: true,
          createdAt: true,
          guestName: true,
          ipHash: true,
          user: { select: { email: true, name: true } },
          contentId: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.review.count({ where: whereReviews }),
    ]);

    // For guest reviews, count how many total reviews share the same ipHash
    const guestIpHashes = Array.from(new Set(base.map(r => (r as any).ipHash).filter(Boolean)));
    const ipHashCounts: Record<string, number> = {};
    if (guestIpHashes.length > 0) {
      const groups = await (prisma.review as any).groupBy({
        by: ['ipHash'],
        where: { ipHash: { in: guestIpHashes } },
        _count: { _all: true },
      });
      for (const g of groups) {
        if (g.ipHash) ipHashCounts[g.ipHash] = g._count._all;
      }
    }

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
      isHidden: r.isHidden,
      hideReason: (r as any).hideReason ?? null,
      createdAt: r.createdAt,
      guestName: r.guestName,
      ipHash: (r as any).ipHash ?? null,
      ipHashCount: (r as any).ipHash ? (ipHashCounts[(r as any).ipHash] ?? 1) : null,
      user: r.user,
      content: contentMap.get(r.contentId) ?? null,
    }));

    return NextResponse.json({ data, total });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }
    // Read a snapshot for the audit detail before deletion.
    const snapshot = await prisma.review.findUnique({
      where: { id },
      select: { id: true, userId: true, rating: true, contentId: true },
    });
    await prisma.review.delete({ where: { id } });
    if (snapshot?.contentId) {
      await recalculateContentScores(snapshot.contentId);
    }
    await writeAuditLog({
      adminId: auth.session.user.id,
      action: 'DELETE_REVIEW',
      targetId: id,
      targetType: 'Review',
      details: snapshot ? `userId=${snapshot.userId ?? 'guest'} rating=${snapshot.rating} contentId=${snapshot.contentId ?? ''}` : null,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    const { id, text, rating, isHidden, hideReason } = body as { id?: string; text?: string | null; rating?: number; isHidden?: boolean; hideReason?: string | null };
    if (!id) return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    const data: any = {};
    if (typeof text !== 'undefined') data.text = text;
    if (typeof rating === 'number') data.rating = rating;
    if (typeof isHidden === 'boolean') data.isHidden = isHidden;
    if (typeof hideReason !== 'undefined') data.hideReason = hideReason || null;
    const updated = await prisma.review.update({ where: { id }, data });

    // Pick the most specific action for the audit log.
    let action: 'HIDE_REVIEW' | 'UNHIDE_REVIEW' | 'EDIT_REVIEW' = 'EDIT_REVIEW';
    let details: string | undefined;
    if (typeof isHidden === 'boolean' && typeof text === 'undefined' && typeof rating === 'undefined') {
      action = isHidden ? 'HIDE_REVIEW' : 'UNHIDE_REVIEW';
    } else {
      const parts: string[] = [];
      if (typeof text !== 'undefined') parts.push('text');
      if (typeof rating === 'number') parts.push(`rating=${rating}`);
      if (typeof isHidden === 'boolean') parts.push(`isHidden=${isHidden}`);
      details = parts.length ? `Edited ${parts.join(', ')}` : undefined;
    }
    await writeAuditLog({
      adminId: auth.session.user.id,
      action,
      targetId: id,
      targetType: 'Review',
      details,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
