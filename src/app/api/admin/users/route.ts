import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAPI } from '@/lib/admin-auth';
import { sendEmail } from '@/lib/mailer';
import { getWarnNotificationEmailHtml, getBanNotificationEmailHtml } from '@/lib/email-templates';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const include = searchParams.get('include');

    // User activity endpoint
    if (userId && include === 'activity') {
      const [user, reviews, auditEntries] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true, role: true, isBanned: true, banReason: true, warnCount: true, createdAt: true },
        }),
        prisma.review.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, rating: true, text: true, createdAt: true, contentId: true },
        }),
        prisma.auditLog.findMany({
          where: { targetId: userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { admin: { select: { email: true } } },
        }),
      ]);

      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      // Resolve content titles for reviews
      const objectIdHex = /^[a-f\d]{24}$/i;
      const validIds = Array.from(new Set(reviews.map(r => r.contentId).filter((id): id is string => Boolean(id) && objectIdHex.test(id as string))));
      const contents = validIds.length
        ? await prisma.content.findMany({ where: { id: { in: validIds } }, select: { id: true, title: true } })
        : [];
      const contentMap = new Map(contents.map(c => [c.id, c.title]));

      const reviewsWithTitle = reviews.map(r => ({
        ...r,
        contentTitle: (r.contentId ? contentMap.get(r.contentId) : null) ?? null,
        createdAt: r.createdAt.toISOString(),
      }));

      return NextResponse.json({
        user: { ...user, createdAt: user.createdAt.toISOString() },
        reviews: reviewsWithTitle,
        auditEntries: auditEntries.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })),
      });
    }

    const page = Number(searchParams.get('page') || '0'); // 0-based
    const pageSize = Math.min(Number(searchParams.get('pageSize') || '10'), 100);
    const explicitSortBy = searchParams.get('sortBy');
    const sortBy = (explicitSortBy || 'createdAt') as 'email' | 'createdAt' | 'role';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const q = searchParams.get('q') || '';
    const role = searchParams.get('role') || '';
    const flagged = searchParams.get('flagged') === 'true';

    const where: any = {};
    if (q) where.OR = [{ email: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }];
    if (role) where.role = role;
    if (flagged) where.OR = [{ isBanned: true }, { warnCount: { gt: 0 } }];

    const orderBy: any = flagged && !explicitSortBy
      ? [{ isBanned: 'desc' }, { warnCount: 'desc' }]
      : { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, createdAt: true, isBanned: true, banReason: true, warnCount: true },
        orderBy,
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
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

async function applySingleUserPatch(
  id: string,
  patch: { role?: 'USER' | 'ADMIN' | 'MODERATOR'; isBanned?: boolean; banReason?: string | null; warnDelta?: number; warnCount?: number; warnReason?: string },
  adminId: string
) {
  const { role, isBanned, banReason, warnDelta, warnCount, warnReason } = patch;

  const data: any = {};
  if (typeof role !== 'undefined') data.role = role;
  if (typeof isBanned !== 'undefined') data.isBanned = !!isBanned;
  if (typeof banReason !== 'undefined') data.banReason = banReason;
  if (typeof warnCount === 'number') data.warnCount = Math.max(0, Math.floor(warnCount));

  let updated;
  if (typeof warnDelta === 'number' && typeof warnCount !== 'number') {
    updated = await prisma.user.update({
      where: { id },
      data: { ...data, warnCount: { increment: Math.floor(warnDelta) } },
      select: { id: true, email: true, name: true, role: true, isBanned: true, banReason: true, warnCount: true },
    });
  } else {
    updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isBanned: true, banReason: true, warnCount: true },
    });
  }

  // Auto-ban after 3 warnings
  if (typeof warnDelta === 'number' && warnDelta > 0 && updated.warnCount >= 3 && !updated.isBanned) {
    updated = await prisma.user.update({
      where: { id },
      data: { isBanned: true, banReason: 'Automatically banned after 3 warnings' },
      select: { id: true, email: true, name: true, role: true, isBanned: true, banReason: true, warnCount: true },
    });
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'BAN_USER',
        targetId: id,
        targetType: 'User',
        details: `${updated.email} | Automatically banned after 3 warnings`,
      },
    });
    // Send auto-ban email
    try {
      await sendEmail({
        to: updated.email,
        subject: 'Account Suspended — WokeOrNot',
        html: getBanNotificationEmailHtml(
          updated.name || undefined,
          'Automatically suspended after 3 warnings',
          (process.env.NEXTAUTH_URL || 'https://wokeornot.net') + '/contact'
        ),
      });
    } catch { /* non-fatal */ }
  } else if (typeof warnDelta === 'number' && warnDelta > 0) {
    // Send warning email
    try {
      await sendEmail({
        to: updated.email,
        subject: 'Account Warning — WokeOrNot',
        html: getWarnNotificationEmailHtml(
          updated.name || undefined,
          updated.warnCount,
          warnReason,
          (process.env.NEXTAUTH_URL || 'https://wokeornot.net') + '/contact'
        ),
      });
    } catch { /* non-fatal */ }
  }

  // Manual ban email
  if (typeof isBanned !== 'undefined' && isBanned === true) {
    try {
      await sendEmail({
        to: updated.email,
        subject: 'Account Suspended — WokeOrNot',
        html: getBanNotificationEmailHtml(
          updated.name || undefined,
          banReason || undefined,
          (process.env.NEXTAUTH_URL || 'https://wokeornot.net') + '/contact'
        ),
      });
    } catch { /* non-fatal */ }
  }

  return updated;
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;
  try {
    const body = await req.json();
    const adminId = auth.session.user.id as string;

    // Bulk operation support
    if (Array.isArray(body.ids)) {
      const { ids, action, banReason } = body as { ids: string[]; action: 'ban' | 'warn'; banReason?: string };
      if (!ids.length) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            if (action === 'ban') {
              const updated = await applySingleUserPatch(id, { isBanned: true, banReason: banReason || null }, adminId);
              await prisma.auditLog.create({
                data: { adminId, action: 'BAN_USER', targetId: id, targetType: 'User', details: `${updated.email} | ${banReason || ''}` },
              });
              return { id, success: true };
            } else if (action === 'warn') {
              const updated = await applySingleUserPatch(id, { warnDelta: 1 }, adminId);
              await prisma.auditLog.create({
                data: { adminId, action: 'WARN_USER', targetId: id, targetType: 'User', details: updated.email },
              });
              try {
                await sendEmail({
                  to: updated.email,
                  subject: 'Account Warning — WokeOrNot',
                  html: getWarnNotificationEmailHtml(
                    (updated as any).name || undefined,
                    updated.warnCount,
                    undefined,
                    (process.env.NEXTAUTH_URL || 'https://wokeornot.net') + '/contact'
                  ),
                });
              } catch { /* non-fatal */ }
              return { id, success: true };
            }
            return { id, success: false, error: 'Unknown action' };
          } catch {
            return { id, success: false, error: 'Update failed' };
          }
        })
      );
      return NextResponse.json({ results });
    }

    const { id, role, isBanned, banReason, warnDelta, warnCount, warnReason } = body as {
      id?: string;
      role?: 'USER' | 'ADMIN' | 'MODERATOR';
      isBanned?: boolean;
      banReason?: string | null;
      warnDelta?: number;
      warnCount?: number;
      warnReason?: string;
    };
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    if (typeof role !== 'undefined' && !['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: `Invalid role: "${role}". Must be USER, MODERATOR, or ADMIN.` }, { status: 400 });
    }

    // Verify user exists
    const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updated = await applySingleUserPatch(id, { role, isBanned, banReason, warnDelta, warnCount, warnReason }, adminId);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
