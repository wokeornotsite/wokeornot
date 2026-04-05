import React from 'react';
import styles from './admin.module.css';
import { Typography, Grid, Paper, Box, Divider, Button } from '@mui/material';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardStats from '@/components/admin/AdminDashboardStats';
import RecentReviewsTable from '@/components/admin/RecentReviewsTable';
import RecentSignupsTable from '@/components/admin/RecentSignupsTable';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';

export default async function AdminDashboardPage() {
  // Protect route: Only allow admins
  const session = await requireAdmin();
  
  // Fetch dashboard stats
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [userCount, reviewCount, contentCount, avgRating, bannedUserCount, hiddenReviewCount, rawSignups, weeklyUsers, weeklyReviews] = await Promise.all([
    prisma.user.count(),
    prisma.review.count(),
    prisma.content.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.review.count({ where: { isHidden: true } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.review.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);
  const recentSignups = rawSignups.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }));
  
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
        bannedUserCount={bannedUserCount}
        hiddenReviewCount={hiddenReviewCount}
        weeklyUsers={weeklyUsers}
        weeklyReviews={weeklyReviews}
      />
      
      <Box mt={4} mb={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" component="h2" style={{ fontWeight: 700, color: '#38bdf8' }}>
            Recent Signups
          </Typography>
          <Typography variant="body2" style={{ color: '#a78bfa', marginBottom: 16 }}>
            The newest users who joined the platform
          </Typography>
        </Box>
        <Button component={Link} href="/admin/moderation?tab=users" size="small" variant="outlined" sx={{ color: '#38bdf8', borderColor: '#38bdf8', textTransform: 'none', flexShrink: 0 }}>
          View All
        </Button>
      </Box>

      <Paper elevation={3} sx={{
        background: 'rgba(24,25,36,0.95)',
        borderRadius: 2,
        border: '1px solid rgba(56,189,248,0.15)',
        overflow: 'hidden',
        mb: 4,
      }}>
        <RecentSignupsTable users={recentSignups} />
      </Paper>

      <Box mt={2} mb={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" component="h2" style={{ fontWeight: 700, color: '#e879f9' }}>
            Recent Reviews
          </Typography>
          <Typography variant="body2" style={{ color: '#a78bfa', marginBottom: 16 }}>
            The latest ratings and reviews from users
          </Typography>
        </Box>
        <Button component={Link} href="/admin/moderation?tab=reviews" size="small" variant="outlined" sx={{ color: '#e879f9', borderColor: '#e879f9', textTransform: 'none', flexShrink: 0 }}>
          View All
        </Button>
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

      {/* Quick Actions */}
      <Box mt={5} mb={2}>
        <Typography variant="h5" component="h2" style={{ fontWeight: 700, color: '#fbbf24' }}>
          Quick Actions
        </Typography>
        <Typography variant="body2" style={{ color: '#9ca3af', marginBottom: 16 }}>
          Common admin tasks at a glance
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          component={Link}
          href="/admin/maintenance"
          variant="contained"
          sx={{ background: '#a78bfa', '&:hover': { background: '#9061e8' }, fontWeight: 700, textTransform: 'none' }}
        >
          Scan Bad Reviews
        </Button>
        <Button
          component={Link}
          href="/admin/audit-log"
          variant="outlined"
          sx={{ color: '#38bdf8', borderColor: '#38bdf8', fontWeight: 700, textTransform: 'none' }}
        >
          View Audit Log
        </Button>
        <Button
          component={Link}
          href="/admin/moderation?tab=users"
          variant="outlined"
          sx={{ color: '#fbbf24', borderColor: '#fbbf24', fontWeight: 700, textTransform: 'none' }}
        >
          Manage Users
        </Button>
      </Box>
    </div>
  );
}
