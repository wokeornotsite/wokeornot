import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { emailNotifications } = body;
  if (typeof emailNotifications !== 'boolean') {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
  }
  await prisma.user.update({
    where: { email: session.user.email },
    data: { emailNotifications },
  });
  return NextResponse.json({ ok: true });
}
