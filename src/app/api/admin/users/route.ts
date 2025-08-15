import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
        select: { id: true, email: true, role: true, createdAt: true },
        orderBy: { [sortBy]: sortOrder },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    // Strip createdAt from response rows for backward compatibility with grids that don't expect it
    const rows = data.map(({ createdAt, ...rest }) => rest);
    return NextResponse.json({ data: rows, total });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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

// Optionally, you can add GET, PATCH, etc. here for other admin user actions.
