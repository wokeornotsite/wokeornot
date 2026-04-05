import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAPI } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let rangeStart: Date;
    let rangeEnd: Date;
    let isCustomRange = false;

    if (startDateParam && endDateParam) {
      rangeStart = new Date(startDateParam);
      rangeEnd = new Date(endDateParam + 'T23:59:59Z');
      isCustomRange = true;
    } else {
      const rawDays = Number(searchParams.get('days') || '30');
      const days = [7, 14, 30, 90].includes(rawDays) ? rawDays : 30;
      rangeEnd = new Date();
      rangeStart = new Date();
      rangeStart.setDate(rangeStart.getDate() - days);
    }

    // Fetch users in range
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
      select: { createdAt: true },
    });

    // Fetch reviews in range
    const reviews = await prisma.review.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
      select: { createdAt: true, rating: true },
    });

    // Group users by date
    const usersByDate: { [key: string]: number } = {};
    users.forEach(user => {
      const date = new Date(user.createdAt).toISOString().split('T')[0];
      usersByDate[date] = (usersByDate[date] || 0) + 1;
    });

    // Group reviews by date and calculate averages
    const reviewsByDate: { [key: string]: { count: number; totalRating: number } } = {};
    reviews.forEach(review => {
      const date = new Date(review.createdAt).toISOString().split('T')[0];
      if (!reviewsByDate[date]) reviewsByDate[date] = { count: 0, totalRating: 0 };
      reviewsByDate[date].count++;
      reviewsByDate[date].totalRating += review.rating;
    });

    // Generate date array spanning the range
    const userData = [];
    const reviewData = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / msPerDay) + 1;

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(rangeStart.getTime() + i * msPerDay);
      const dateStr = date.toISOString().split('T')[0];

      userData.push({ date: dateStr, signups: usersByDate[dateStr] || 0 });

      const reviewInfo = reviewsByDate[dateStr];
      reviewData.push({
        date: dateStr,
        reviews: reviewInfo?.count || 0,
        avgRating: reviewInfo ? Number((reviewInfo.totalRating / reviewInfo.count).toFixed(1)) : 0,
      });
    }

    // Top content queries (not date-range dependent)
    const [topReviewed, topWoke] = await Promise.all([
      prisma.content.findMany({
        orderBy: { reviewCount: 'desc' },
        take: 10,
        select: { id: true, title: true, contentType: true, reviewCount: true, wokeScore: true },
      }),
      prisma.content.findMany({
        where: { reviewCount: { gt: 0 } },
        orderBy: { wokeScore: 'desc' },
        take: 10,
        select: { id: true, title: true, contentType: true, reviewCount: true, wokeScore: true },
      }),
    ]);

    return NextResponse.json({
      userData,
      reviewData,
      topReviewed,
      topWoke,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}