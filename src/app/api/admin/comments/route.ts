import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffAPI } from '@/lib/admin-auth';
import { writeAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '0');
    const pageSize = Math.min(Number(searchParams.get('pageSize') || '20'), 100);
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const q = searchParams.get('q')?.trim() || '';
    const contentType = searchParams.get('contentType') || '';
    const deletedParam = searchParams.get('deleted') || 'false';

    const where: any = {};

    if (deletedParam === 'true') {
      where.isDeleted = true;
    } else if (deletedParam === 'false') {
      where.isDeleted = false;
    }
    // 'all' → no isDeleted filter

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

      where.OR = [
        { text: { contains: q, mode: 'insensitive' } },
      ];
      if (users.length) {
        where.OR.push({ userId: { in: users.map((u: any) => u.id) } });
      }

      const contentWhere: any = {};
      if (q) contentWhere.title = { contains: q, mode: 'insensitive' };
      if (contentType) contentWhere.contentType = contentType as any;
      const contents = await prisma.content.findMany({ where: contentWhere, select: { id: true }, take: 500 });
      if (contents.length) {
        where.OR.push({ contentId: { in: contents.map((c: any) => c.id) } });
      }
    } else if (contentType) {
      const contents = await prisma.content.findMany({
        where: { contentType: contentType as any },
        select: { id: true },
        take: 500,
      });
      where.contentId = { in: contents.map((c: any) => c.id) };
    }

    const [base, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        select: {
          id: true,
          text: true,
          isDeleted: true,
          createdAt: true,
          parentId: true,
          contentId: true,
          user: { select: { email: true, name: true, id: true } },
        },
        orderBy: { createdAt: sortOrder },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.comment.count({ where }),
    ]);

    const objectIdHex = /^[a-f\d]{24}$/i;
    const validIds = Array.from(
      new Set(base.map((c: any) => c.contentId).filter((id: any): id is string => Boolean(id) && objectIdHex.test(id)))
    );
    const contents = validIds.length
      ? await prisma.content.findMany({ where: { id: { in: validIds } }, select: { id: true, title: true, contentType: true } })
      : [];
    const contentMap = new Map(contents.map((c: any) => [c.id, { title: c.title, contentType: c.contentType }]));

    const data = base.map((c: any) => ({
      id: c.id,
      text: c.text,
      isDeleted: c.isDeleted,
      createdAt: c.createdAt,
      parentId: c.parentId,
      user: c.user,
      content: c.contentId ? (contentMap.get(c.contentId) ?? null) : null,
    }));

    return NextResponse.json({ data, total });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;
  try {
    const { id, isDeleted } = await req.json();
    if (!id || typeof isDeleted !== 'boolean') {
      return NextResponse.json({ error: 'id and isDeleted are required' }, { status: 400 });
    }
    const updated = await prisma.comment.update({ where: { id }, data: { isDeleted } });
    await writeAuditLog({
      adminId: auth.session.user.id,
      action: isDeleted ? 'DELETE_COMMENT' : 'RESTORE_COMMENT',
      targetId: id,
      targetType: 'Comment',
    });
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireStaffAPI();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();

    // Bulk hard-delete
    if (Array.isArray(body.ids)) {
      const ids: string[] = body.ids.slice(0, 500);
      await prisma.comment.deleteMany({ where: { id: { in: ids } } });
      await writeAuditLog({
        adminId: auth.session.user.id,
        action: 'DELETE_COMMENT',
        targetId: ids[0] ?? 'bulk',
        targetType: 'Comment',
        details: `Hard-deleted ${ids.length} comment(s)`,
      });
      return NextResponse.json({ success: true, deleted: ids.length });
    }

    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    await prisma.comment.delete({ where: { id } });
    await writeAuditLog({
      adminId: auth.session.user.id,
      action: 'DELETE_COMMENT',
      targetId: id,
      targetType: 'Comment',
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
