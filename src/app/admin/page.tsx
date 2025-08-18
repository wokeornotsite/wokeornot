import React from 'react';
import styles from './admin.module.css';
import { Typography, Grid, Paper, Box, Divider } from '@mui/material';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardStats from '@/components/admin/AdminDashboardStats';
import RecentReviewsTable from '@/components/admin/RecentReviewsTable';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';

export default async function AdminDashboardPage() {
  // Protect route: Only allow admins
  const session = await requireAdmin();
  
  // Fetch dashboard stats
  const userCount = await prisma.user.count();
  const reviewCount = await prisma.review.count();
  const contentCount = await prisma.content.count();
  const avgRating = await prisma.review.aggregate({ _avg: { rating: true } });
  
  // Fetch recent reviews for the dashboard
  // Avoid including relations directly to prevent ObjectId coercion errors on malformed contentId
  const baseReviews = await prisma.review.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      text: true,
      rating: true,
      createdAt: true,
      guestName: true,
      user: { select: { name: true, email: true } },
      contentId: true,
    },
  });

  // Collect valid Mongo ObjectId-like contentIds (24-hex chars)
  const objectIdHex = /^[a-f\d]{24}$/i;
  const validContentIds = Array.from(
    new Set(
      baseReviews
        .map(r => r.contentId)
        .filter((id): id is string => Boolean(id) && objectIdHex.test(id as string))
    )
  );

  const contents = validContentIds.length
    ? await prisma.content.findMany({
        where: { id: { in: validContentIds } },
        select: { id: true, title: true, contentType: true },
      })
    : [];
  const contentMap = new Map(contents.map(c => [c.id, { title: c.title, contentType: c.contentType }]));

  const recentReviews = baseReviews.map(r => ({
    id: r.id,
    text: r.text,
    rating: r.rating,
    createdAt: r.createdAt,
    guestName: r.guestName,
    user: r.user,
    content: contentMap.get(r.contentId) ?? null,
  }));

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Dashboard' }]} />
      <Typography variant="h3" component="h1" gutterBottom style={{ fontWeight: 900, background: 'linear-gradient(90deg,#e879f9,#a78bfa 50%,#38bdf8 100%)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        Admin Dashboard
      </Typography>
      <Typography variant="h6" style={{ color: '#38bdf8', marginBottom: 24 }}>
        Welcome, {session.user.name || session.user.email}! Here's an overview of your site.
      </Typography>
      
      {/* Dashboard Stats */}
      <AdminDashboardStats 
        userCount={userCount}
        reviewCount={reviewCount}
        contentCount={contentCount}
        avgRating={avgRating._avg.rating || 0}
      />
      
      <Box mt={4} mb={2}>
        <Typography variant="h5" component="h2" style={{ fontWeight: 700, color: '#e879f9' }}>
          Recent Reviews
        </Typography>
        <Typography variant="body2" style={{ color: '#a78bfa', marginBottom: 16 }}>
          The latest ratings and reviews from users
        </Typography>
      </Box>
      
      {/* Recent Reviews Table */}
      <Paper elevation={3} sx={{ 
        background: 'rgba(24,25,36,0.95)', 
        borderRadius: 2,
        border: '1px solid rgba(56,189,248,0.15)',
        overflow: 'hidden'
      }}>
        <RecentReviewsTable reviews={recentReviews as any} />
      </Paper>
    </div>
  );
}
