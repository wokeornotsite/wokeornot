import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH: Edit a comment
// @ts-expect-error Next.js does not export type for context
export async function PATCH(req: NextRequest, context) {
  try {
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (!session || typeof session !== 'object' || !('user' in session) || !session.user || typeof session.user !== 'object' || !('email' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { email: string };
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { commentId, text } = await req.json();
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
    const updated = await prisma.comment.update({ where: { id: commentId }, data: { text } });
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
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (!session || typeof session !== 'object' || !('user' in session) || !session.user || typeof session.user !== 'object' || !('email' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user as { email: string };
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { commentId } = await req.json();
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
