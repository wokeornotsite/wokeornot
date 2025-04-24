import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { admin: { select: { email: true } } },
    });
    return res.json(logs);
  }
  if (req.method === 'POST') {
    const { action, targetId, targetType, details } = req.body;
    const log = await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action,
        targetId,
        targetType,
        details,
      },
    });
    return res.json(log);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
