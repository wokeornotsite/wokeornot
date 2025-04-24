import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  // Site metrics
  const userCount = await prisma.user.count();
  const reviewCount = await prisma.review.count();
  const avgRating = await prisma.review.aggregate({ _avg: { rating: true } });
  const activeUsers = await prisma.session.count({ where: { expires: { gt: new Date() } } });

  return res.json({ userCount, reviewCount, avgRating: avgRating._avg.rating, activeUsers });
}
