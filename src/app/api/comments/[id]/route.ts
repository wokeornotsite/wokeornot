import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseJson, schemas, sanitizeHTML } from '@/lib/validation';
import { createNotification } from '@/lib/notifications';
import { rateLimitCheck, setRateLimitHeaders } from '@/lib/rateLimit';
import { error as httpError } from '@/lib/http';
import { checkCommentBadges } from '@/lib/badges';
import { getPostHogClient } from '@/lib/posthog-server';

 
// @ts-expect-error Next.js does not export type for context
export async function GET(req: NextRequest, context) {
  try {
    const { id } = await context.params;
    const comments = await prisma.comment.findMany({
      where: { contentId: id, parentId: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(comments);
  } catch (error: unknown) {
    let message = 'Failed to fetch comments.';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

 
// @ts-expect-error Next.js does not export type for context
export async function POST(req: NextRequest, context) {
  try {
    const rl = rateLimitCheck(req, { limit: 10, windowMs: 60_000, route: 'comment_submit' });
    if (!rl.allowed && !rl.shadowed) {
      const res = httpError(429, 'Too Many Requests', 'RATE_LIMITED');
      setRateLimitHeaders(res, rl);
      return res;
    }
    const session = await getServerSession(authOptions);
    if (!session || typeof session !== 'object' || !('user' in session) || !session.user || typeof session.user !== 'object' || !('email' in session.user) || !('expires' in session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { email: string };
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const id = context.params.id;
    const { text, parentId } = await parseJson(req as any, schemas.commentCreate);
    const safeText = sanitizeHTML(text);
    // Find user
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId: dbUser.id,
        contentId: id,
        text: safeText,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    checkCommentBadges(dbUser.id).catch(() => {});
    try { getPostHogClient().capture({ distinctId: dbUser.id, event: 'comment_submitted', properties: { content_id: id, is_reply: !!parentId } }); } catch {}

    // Notify parent comment author if this is a reply
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true, contentId: true },
      });
      if (parentComment && parentComment.userId !== dbUser.id) {
        let link: string | undefined;
        if (parentComment.contentId) {
          const content = await prisma.content.findUnique({
            where: { id: parentComment.contentId },
            select: { tmdbId: true, contentType: true },
          });
          if (content) {
            const linkPrefix =
              content.contentType === 'TV_SHOW'
                ? '/tv-shows'
                : content.contentType === 'KIDS'
                ? '/kids'
                : '/movies';
            link = `${linkPrefix}/${content.tmdbId}`;
          }
        }
        await createNotification({
          userId: parentComment.userId,
          type: 'COMMENT_REPLY',
          message: 'Someone replied to your comment',
          link,
        });
      }
    }

    return NextResponse.json(comment);
  } catch (error: unknown) {
    let message = 'Failed to submit comment.';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
// PATCH: Edit a comment
// @ts-expect-error Next.js does not export type for context
export async function PATCH(req: NextRequest, context) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      typeof session !== 'object' ||
      !('user' in session) ||
      !session.user ||
      typeof session.user !== 'object' ||
      !('email' in session.user)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { email: string };
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { commentId, text } = await parseJson(req as any, schemas.commentUpdate);
    const safeText = sanitizeHTML(text);
    // Find user
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Find comment
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Not authorized to edit this comment' }, { status: 403 });
    }
    // Update comment
    const updated = await prisma.comment.update({ where: { id: commentId }, data: { text: safeText } });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    let message = 'Failed to update comment.';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Delete a comment
// @ts-expect-error Next.js does not export type for context
export async function DELETE(req: NextRequest, context) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      typeof session !== 'object' ||
      !('user' in session) ||
      !session.user ||
      typeof session.user !== 'object' ||
      !('email' in session.user)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { email: string };
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { commentId } = await parseJson(req as any, schemas.commentDelete);
    // Find user
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Find comment
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
    }
    // Delete comment
    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    let message = 'Failed to delete comment.';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}