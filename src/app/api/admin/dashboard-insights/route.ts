import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffAPI } from '@/lib/admin-auth';

/**
 * GET /api/admin/dashboard-insights
 *
 * Returns moderation-health metrics for the last 30 days plus a top-reviewers
 * list for the current calendar month. All metrics are derived from existing
 * tables (Review, AuditLog, User) — no schema additions.
 */
export async function GET(_req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  try {
    const [hiddenReviews, auditEntries, topReviewers] = await Promise.all([
      prisma.review.findMany({
        where: { isHidden: true, updatedAt: { gte: thirtyDaysAgo } },
        select: { updatedAt: true },
      }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { adminId: true, action: true },
      }),
      prisma.review.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: monthStart }, userId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Bucket hidden reviews by day (YYYY-MM-DD UTC) so the chart aligns even
    // for sparse days.
    const hiddenByDay = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      hiddenByDay.set(key, 0);
    }
    for (const r of hiddenReviews) {
      const key = r.updatedAt.toISOString().slice(0, 10);
      if (hiddenByDay.has(key)) hiddenByDay.set(key, (hiddenByDay.get(key) ?? 0) + 1);
    }
    const hiddenReviewsByDay = Array.from(hiddenByDay.entries()).map(([date, count]) => ({ date, count }));

    // Group audit entries by admin → resolve emails.
    const actionsByAdminId = new Map<string, number>();
    for (const a of auditEntries) {
      actionsByAdminId.set(a.adminId, (actionsByAdminId.get(a.adminId) ?? 0) + 1);
    }
    const adminIds = Array.from(actionsByAdminId.keys());
    const admins = adminIds.length
      ? await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, email: true, name: true } })
      : [];
    const adminMap = new Map(admins.map((u) => [u.id, u]));
    const actionsByAdmin = adminIds
      .map((id) => ({
        adminId: id,
        email: adminMap.get(id)?.email ?? '(deleted)',
        name: adminMap.get(id)?.name ?? null,
        count: actionsByAdminId.get(id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Resolve top reviewer emails.
    const reviewerIds = topReviewers
      .map((r) => r.userId)
      .filter((id): id is string => Boolean(id));
    const reviewers = reviewerIds.length
      ? await prisma.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, email: true, name: true } })
      : [];
    const reviewerMap = new Map(reviewers.map((u) => [u.id, u]));
    const topReviewersThisMonth = topReviewers.map((r) => ({
      userId: r.userId,
      email: r.userId ? reviewerMap.get(r.userId)?.email ?? '(deleted)' : 'guest',
      name: r.userId ? reviewerMap.get(r.userId)?.name ?? null : null,
      reviewCount: r._count.id,
    }));

    return NextResponse.json({
      hiddenReviewsByDay,
      actionsByAdmin,
      topReviewersThisMonth,
      windowDays: 30,
    });
  } catch (err) {
    console.error('[admin/dashboard-insights] failed', err);
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 });
  }
}
