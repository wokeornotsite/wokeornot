import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const objectIdHex = /^[a-f\d]{24}$/i;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Optional limit param for faster scans
    const { searchParams } = new URL(req.url);
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
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
