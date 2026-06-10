import React from 'react';
import styles from './admin.module.css';
import { Typography, Grid, Paper, Box, Divider, Button } from '@mui/material';
import Link from 'next/link';
import { requireStaff } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardStats from '@/components/admin/AdminDashboardStats';
import RecentReviewsTable from '@/components/admin/RecentReviewsTable';
import RecentSignupsTable from '@/components/admin/RecentSignupsTable';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import DashboardInsights from '@/components/admin/DashboardInsights';

export default async function AdminDashboardPage() {
  // Protect route: Only allow admins
  const session = await requireStaff();
  
  // Fetch dashboard stats
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [userCount, reviewCount, contentCount, avgRating, bannedUserCount, hiddenReviewCount, flaggedUserCount, rawSignups, weeklyUsers, weeklyReviews] = await Promise.all([
    prisma.user.count(),
    prisma.review.count(),
    prisma.content.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.review.count({ where: { isHidden: true } }),
    prisma.user.count({ where: { OR: [{ isBanned: true }, { warnCount: { gt: 0 } }] } }),
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
        select: { id: true, title: true, contentType: true, tmdbId: true },
      })
    : [];
  const contentMap = new Map(contents.map(c => [c.id, { title: c.title, contentType: c.contentType, tmdbId: c.tmdbId }]));

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

      {/* Moderation health widgets */}
      <DashboardInsights />

      <Box mt={4} mb={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" component="h2" style={{ fontWeight: 700, color: '#38bdf8' }}>
            Recent Signups
          </Typography>
          <Typography variant="body2" style={{ color: '#a78bfa', marginBottom: 16 }}>
            The newest users who joined the platform
          </Typography>
        </Box>
        <Button component={Link} href="/admin/users" size="small" variant="outlined" sx={{ color: '#38bdf8', borderColor: '#38bdf8', textTransform: 'none', flexShrink: 0 }}>
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
        <Button component={Link} href="/admin/moderation" size="small" variant="outlined" sx={{ color: '#e879f9', borderColor: '#e879f9', textTransform: 'none', flexShrink: 0 }}>
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

      {/* Needs attention — triage cards deep-linking to filtered work */}
      <Box mt={5} mb={2}>
        <Typography variant="h5" component="h2" style={{ fontWeight: 700, color: '#fbbf24' }}>
          Needs Attention
        </Typography>
        <Typography variant="body2" style={{ color: '#9ca3af', marginBottom: 16 }}>
          Outstanding moderation work — tap a card to jump straight to it
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TriageCard
            href="/admin/users?flagged=true"
            label="Flagged users"
            count={flaggedUserCount}
            hint="Banned or warned accounts"
            color="#f97316"
            zeroHint="No flagged users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TriageCard
            href="/admin/users?flagged=true"
            label="Banned users"
            count={bannedUserCount}
            hint="Currently blocked from logging in"
            color="#ef4444"
            zeroHint="No banned users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TriageCard
            href="/admin/moderation"
            label="Hidden reviews"
            count={hiddenReviewCount}
            hint="Hidden from public, not deleted"
            color="#a78bfa"
            zeroHint="No hidden reviews"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TriageCard
            href="/admin/audit-log"
            label="Audit log"
            count={null}
            hint="Full history of admin actions"
            color="#38bdf8"
          />
        </Grid>
      </Grid>
    </div>
  );
}

function TriageCard({ href, label, count, hint, color, zeroHint }: { href: string; label: string; count: number | null; hint: string; color: string; zeroHint?: string }) {
  const isZero = count === 0;
  return (
    <Paper
      component={Link}
      href={href}
      elevation={3}
      sx={{
        display: 'block',
        textDecoration: 'none',
        background: 'rgba(24,25,36,0.95)',
        borderRadius: 2,
        border: `1px solid ${color}33`,
        borderLeft: `4px solid ${color}`,
        p: 2,
        height: '100%',
        transition: 'transform 0.12s, border-color 0.12s',
        '&:hover': { transform: 'translateY(-2px)', borderColor: color },
      }}
    >
      <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{label}</Typography>
      {count !== null && (
        <Typography sx={{ color: isZero ? '#4ade80' : color, fontWeight: 900, fontSize: 30, lineHeight: 1.1, mt: 0.5 }}>
          {count}
        </Typography>
      )}
      <Typography sx={{ color: '#9ca3af', fontSize: 12, mt: 0.5 }}>
        {isZero && zeroHint ? zeroHint : hint}
      </Typography>
    </Paper>
  );
}
