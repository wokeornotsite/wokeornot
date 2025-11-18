import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAPI } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;

  try {
    // Get data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch users created in the last 30 days
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Fetch reviews created in the last 30 days
    const reviews = await prisma.review.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
        rating: true,
      },
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
      if (!reviewsByDate[date]) {
        reviewsByDate[date] = { count: 0, totalRating: 0 };
      }
      reviewsByDate[date].count++;
      reviewsByDate[date].totalRating += review.rating;
    });

    // Generate last 30 days array
    const userData = [];
    const reviewData = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      userData.push({
        date: dateStr,
        signups: usersByDate[dateStr] || 0,
        active: usersByDate[dateStr] || 0, // Simplified - could track actual active users
      });
      
      const reviewInfo = reviewsByDate[dateStr];
      reviewData.push({
        date: dateStr,
        reviews: reviewInfo?.count || 0,
        avgRating: reviewInfo ? Number((reviewInfo.totalRating / reviewInfo.count).toFixed(1)) : 0,
      });
    }

    return NextResponse.json({
      userData,
      reviewData,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}