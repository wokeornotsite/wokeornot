import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const movies = await prisma.content.findMany({});
    return res.json(movies);
  }
  if (req.method === 'PATCH') {
    const { id, ...data } = req.body;
    const movie = await prisma.content.update({ where: { id }, data });
    return res.json(movie);
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    await prisma.content.delete({ where: { id } });
    return res.json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
