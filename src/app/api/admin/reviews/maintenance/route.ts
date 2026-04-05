import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAPI } from '@/lib/admin-auth';

const objectIdHex = /^[a-f\d]{24}$/i;

export async function GET(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const scanType = searchParams.get('scanType');

    // Duplicate reviews scan
    if (scanType === 'duplicates') {
      // Fetch all reviews with userId and contentId
      const allReviews = await prisma.review.findMany({
        select: { id: true, userId: true, contentId: true },
        orderBy: { createdAt: 'asc' }, // keep the oldest
      });

      // Group by userId+contentId
      const groups = new Map<string, string[]>();
      for (const r of allReviews) {
        const key = `${r.userId ?? '__guest'}::${r.contentId ?? '__none'}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r.id);
      }

      // Find groups with duplicates (more than 1 review)
      const duplicateGroups: string[][] = [];
      for (const ids of groups.values()) {
        if (ids.length > 1) duplicateGroups.push(ids);
      }

      // Collect IDs to delete (all but the first in each group)
      const toDeleteIds: string[] = [];
      for (const ids of duplicateGroups) {
        toDeleteIds.push(...ids.slice(1));
      }

      return NextResponse.json({
        duplicateGroupCount: duplicateGroups.length,
        toDeleteCount: toDeleteIds.length,
        ids: toDeleteIds,
      });
    }

    // Optional limit param for faster scans
    const limit = Number(searchParams.get('limit') || '0');

    const batchSize = 1000;
    let skip = 0;
    let total = 0;
    const malformed: { id: string; contentId: string | null }[] = [];
    const orphaned: { id: string; contentId: string | null }[] = [];

    while (true) {
      const batch = await prisma.review.findMany({
        select: { id: true, contentId: true },
        skip,
        take: batchSize,
        orderBy: { id: 'asc' },
      });
      if (!batch.length) break;
      skip += batch.length;

      // Malformed: not 24-hex
      for (const r of batch) {
        if (!r.contentId || !objectIdHex.test(r.contentId)) malformed.push({ id: r.id, contentId: r.contentId });
      }

      // Orphaned: valid hex but missing content
      const validIds = Array.from(new Set(batch.map(r => r.contentId).filter((id): id is string => !!id && objectIdHex.test(id))));
      if (validIds.length) {
        const contents = await prisma.content.findMany({ select: { id: true }, where: { id: { in: validIds } } });
        const existing = new Set(contents.map(c => c.id));
        for (const r of batch) {
          if (r.contentId && objectIdHex.test(r.contentId) && !existing.has(r.contentId)) {
            orphaned.push({ id: r.id, contentId: r.contentId });
          }
        }
      }

      total += batch.length;
      if (limit && total >= limit) break;
    }

    const allBadIds = Array.from(new Set([...malformed.map(r => r.id), ...orphaned.map(r => r.id)]));

    return NextResponse.json({
      totalScanned: total,
      malformedCount: malformed.length,
      orphanedCount: orphaned.length,
      toDeleteCount: allBadIds.length,
      sample: {
        malformed: malformed.slice(0, 20),
        orphaned: orphaned.slice(0, 20),
      },
      ids: allBadIds,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to scan reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) return NextResponse.json({ error: 'No review IDs provided' }, { status: 400 });

    const res = await prisma.review.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ deleted: res.count || 0 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete reviews' }, { status: 500 });
  }
}
