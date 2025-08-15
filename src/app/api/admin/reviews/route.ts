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
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'rating';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const q = searchParams.get('q') || '';
    const contentType = searchParams.get('contentType') || '';

    const where: any = {};
    if (q) {
      where.OR = [
        { text: { contains: q, mode: 'insensitive' } },
        { guestName: { contains: q, mode: 'insensitive' } },
        { user: { is: { email: { contains: q, mode: 'insensitive' } } } },
        { content: { is: { title: { contains: q, mode: 'insensitive' } } } },
      ];
    }
    if (contentType) {
      where.content = { is: { ...(where.content?.is || {}), contentType } };
    }

    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { email: true, name: true } },
          content: { select: { title: true, contentType: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
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
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
