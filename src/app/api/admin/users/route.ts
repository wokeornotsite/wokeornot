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
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'email' | 'createdAt' | 'role';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const q = searchParams.get('q') || '';
    const role = searchParams.get('role') || '';

    const where: any = {};
    if (q) where.email = { contains: q, mode: 'insensitive' };
    if (role) where.role = role;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, role: true, createdAt: true, isBanned: true, banReason: true, warnCount: true },
        orderBy: { [sortBy]: sortOrder },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    // Keep createdAt in data, clients can ignore if unused
    return NextResponse.json({ data, total });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    const { id, role, isBanned, banReason, warnDelta, warnCount } = body as {
      id?: string;
      role?: 'USER' | 'ADMIN' | 'MODERATOR' | 'BANNED';
      isBanned?: boolean;
      banReason?: string | null;
      warnDelta?: number; // increment by delta
      warnCount?: number; // or set absolute value
    };
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const data: any = {};
    if (typeof role !== 'undefined') data.role = role;
    if (typeof isBanned !== 'undefined') data.isBanned = !!isBanned;
    if (typeof banReason !== 'undefined') data.banReason = banReason;
    if (typeof warnCount === 'number') data.warnCount = Math.max(0, Math.floor(warnCount));

    // If only warnDelta provided, perform increment
    let updated;
    if (typeof warnDelta === 'number' && typeof warnCount !== 'number') {
      updated = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          warnCount: { increment: Math.floor(warnDelta) },
        },
        select: { id: true, email: true, role: true, isBanned: true, banReason: true, warnCount: true },
      });
    } else {
      updated = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, email: true, role: true, isBanned: true, banReason: true, warnCount: true },
      });
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
