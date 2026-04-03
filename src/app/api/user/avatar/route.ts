import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ALLOWED_AVATARS = [
  '/avatars/avatar1.png',
  '/avatars/avatar1.svg',
  '/avatars/avatar10.svg',
  '/avatars/avatar11.svg',
  '/avatars/avatar12.svg',
  '/avatars/avatar2.png',
  '/avatars/avatar2.svg',
  '/avatars/avatar3.svg',
  '/avatars/avatar4.svg',
  '/avatars/avatar5.svg',
  '/avatars/avatar6.svg',
  '/avatars/avatar7.svg',
  '/avatars/avatar8.svg',
  '/avatars/avatar9.svg',
  '/avatars/default.png',
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { avatar } = await req.json();
  if (!avatar || !ALLOWED_AVATARS.includes(avatar)) {
    return NextResponse.json({ error: 'Invalid avatar selection' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { avatar },
  });

  return NextResponse.json({ avatar: updated.avatar });
}
