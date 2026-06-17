import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffAPI } from '@/lib/admin-auth';
import { writeAuditLog } from '@/lib/audit';
import { recalculateContentScores } from '@/lib/recalculate-content-scores';

export async function PATCH(req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;
  try {
    const { ids, isHidden, hideReason } = await req.json() as {
      ids: string[];
      isHidden: boolean;
      hideReason?: string;
    };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }
    if (typeof isHidden !== 'boolean') {
      return NextResponse.json({ error: 'isHidden boolean is required' }, { status: 400 });
    }

    const capped = ids.slice(0, 500);
    const updateData: any = { isHidden };
    if (typeof hideReason === 'string') updateData.hideReason = hideReason || null;

    // Fetch affected content IDs before updating so we can recalculate scores after.
    const affected = await prisma.review.findMany({
      where: { id: { in: capped } },
      select: { contentId: true },
    });
    const contentIds = [...new Set(affected.map(r => r.contentId).filter(Boolean))];

    await prisma.review.updateMany({ where: { id: { in: capped } }, data: updateData });

    // Recalculate scores for all affected content (hidden reviews must not count).
    await Promise.all(contentIds.map(cid => recalculateContentScores(cid)));

    await writeAuditLog({
      adminId: auth.session.user.id,
      action: isHidden ? 'HIDE_REVIEW' : 'UNHIDE_REVIEW',
      targetId: capped[0] ?? 'bulk',
      targetType: 'Review',
      details: `Batch ${isHidden ? 'hid' : 'unhid'} ${capped.length} review(s)`,
    });

    return NextResponse.json({ success: true, updated: capped.length });
  } catch {
    return NextResponse.json({ error: 'Failed to batch-update reviews' }, { status: 500 });
  }
}
