import React from 'react';
import styles from './admin.module.css';
import { Typography, Grid, Paper, Box, Divider } from '@mui/material';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardStats from '@/components/admin/AdminDashboardStats';
import RecentReviewsTable from '@/components/admin/RecentReviewsTable';

export default async function AdminDashboardPage() {
  // Protect route: Only allow admins
  const session = await requireAdmin();
  
  // Fetch dashboard stats
  const userCount = await prisma.user.count();
  const reviewCount = await prisma.review.count();
  const contentCount = await prisma.content.count();
  const avgRating = await prisma.review.aggregate({ _avg: { rating: true } });
  
  // Fetch recent reviews for the dashboard
  const recentReviews = await prisma.review.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      content: { select: { title: true, contentType: true } }
    }
  });

  return (
    <div>
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
        <RecentReviewsTable reviews={recentReviews} />
      </Paper>
    </div>
  );
}
