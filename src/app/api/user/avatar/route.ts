import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('avatar') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop() || 'png';
  const filename = `${session.user.email.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'avatars');
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  const imageUrl = `/avatars/${filename}`;
  await prisma.user.update({
    where: { email: session.user.email },
    data: { image: imageUrl },
  });

  return NextResponse.json({ image: imageUrl });
}
