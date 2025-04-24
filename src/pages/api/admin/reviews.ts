import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const reviews = await prisma.review.findMany({ include: { user: true, content: true } });
    return res.json(reviews);
  }
  if (req.method === 'PATCH') {
    const { id, text, rating } = req.body;
    const review = await prisma.review.update({ where: { id }, data: { text, rating } });
    return res.json(review);
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    await prisma.review.delete({ where: { id } });
    return res.json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
