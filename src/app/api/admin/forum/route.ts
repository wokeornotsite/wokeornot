import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAPI } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '0');
    const pageSize = Math.min(Number(searchParams.get('pageSize') || '10'), 100);
    const q = searchParams.get('q')?.trim() || '';

    const where: any = q
      ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { content: { contains: q, mode: 'insensitive' } }] }
      : undefined;

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.forumThread.count({ where }),
    ]);

    // Manual join: fetch users for the thread userIds
    const userIds = Array.from(new Set(threads.map((t: any) => t.userId).filter(Boolean)));
    const users = userIds.length
      ? await prisma.user.findMany({ where: { id: { in: userIds as string[] } }, select: { id: true, email: true, name: true } })
      : [];
    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const data = threads.map((t: any) => ({
      ...t,
      user: userMap.get(t.userId) ?? null,
    }));

    return NextResponse.json({ data, total });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch forum threads' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Thread ID required' }, { status: 400 });
    await prisma.forumThread.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete forum thread' }, { status: 500 });
  }
}
