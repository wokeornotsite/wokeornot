import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffAPI } from '@/lib/admin-auth';
import { writeAuditLog } from '@/lib/audit';
import { recalculateContentScores } from '@/lib/recalculate-content-scores';

export async function POST(req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;
  try {
    const { ids } = await req.json() as { ids?: unknown };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 });
    }
    if (ids.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 reviews per bulk delete' }, { status: 400 });
    }
    const validIds = ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'No valid review IDs provided' }, { status: 400 });
    }

    // Snapshot before deletion for audit log and score recalculation
    const snapshots = await prisma.review.findMany({
      where: { id: { in: validIds } },
      select: { id: true, userId: true, rating: true, contentId: true },
    });

    const affectedContentIds = Array.from(new Set(snapshots.map(s => s.contentId).filter(Boolean))) as string[];

    await prisma.review.deleteMany({ where: { id: { in: validIds } } });

    // Recalculate scores for all affected content items
    await Promise.all(affectedContentIds.map(cid => recalculateContentScores(cid)));

    await writeAuditLog({
      adminId: auth.session.user.id,
      action: 'DELETE_REVIEW',
      targetId: validIds[0],
      targetType: 'Review',
      details: `Bulk deleted ${validIds.length} review(s). IDs: ${validIds.slice(0, 10).join(', ')}${validIds.length > 10 ? '...' : ''}`,
    });

    return NextResponse.json({ success: true, deleted: snapshots.length });
  } catch {
    return NextResponse.json({ error: 'Failed to bulk delete reviews' }, { status: 500 });
  }
}
