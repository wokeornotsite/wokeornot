import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    // Get pagination parameters from query or use defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination info
    const total = await prisma.content.count();
    
    // Get paginated content with only necessary fields
    const movies = await prisma.content.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        releaseDate: true,
        contentType: true,
        wokeScore: true,
        reviewCount: true,
        createdAt: true,
        posterPath: true,
      }
    });
    
    return res.json({
      data: movies,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
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
