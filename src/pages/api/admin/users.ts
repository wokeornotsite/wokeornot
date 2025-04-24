import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true, updatedAt: true } });
    return res.json(users);
  }
  if (req.method === 'PATCH') {
    const { id, role, status } = req.body;
    const user = await prisma.user.update({ where: { id }, data: { role } });
    return res.json(user);
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    await prisma.user.delete({ where: { id } });
    return res.json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
