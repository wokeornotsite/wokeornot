import { NextRequest, NextResponse } from 'next/server';
import getServerSession from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

 
// @ts-expect-error Next.js does not export type for context
export async function GET(req: NextRequest, context) {
  try {
    const { threadId } = await context.params;
    const comments = await prisma.comment.findMany({
      where: { contentId: threadId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(comments);
  } catch (error: unknown) {
    let message = 'Failed to fetch comments.';
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: string }).message === 'string') {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

 
// @ts-expect-error Next.js does not export type for context
export async function POST(req: NextRequest, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { threadId } = await context.params;
    const { text } = await req.json();
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        contentId: threadId,
        text,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
    return NextResponse.json(comment);
  } catch (error: unknown) {
    let message = 'Failed to submit comment.';
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: string }).message === 'string') {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
