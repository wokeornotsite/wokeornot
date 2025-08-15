import React from 'react';
import { Typography, Box, Divider, Paper } from '@mui/material';
import ModerationReviewsTable from './ModerationReviewsTable';
import ModerationUsersTable from './ModerationUsersTable';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';

export default function ModerationPage() {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Moderation' }]} />
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 900, background: 'linear-gradient(90deg,#e879f9,#a78bfa 50%,#38bdf8 100%)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        Moderation Tools
      </Typography>
      <Typography variant="h6" sx={{ color: '#38bdf8', mb: 4 }}>
        Review, approve, hide, or delete content. Ban or warn users as needed.
      </Typography>
      <Paper elevation={2} sx={{ p: 3, mb: 6, background: 'rgba(24,25,36,0.97)', borderRadius: 3, border: '1px solid #232336' }}>
        <Typography variant="h5" sx={{ color: '#fbbf24', fontWeight: 700, mb: 2 }}>Review Moderation</Typography>
        <Divider sx={{ mb: 3, borderColor: '#fbbf24', opacity: 0.2 }} />
        <ModerationReviewsTable />
      </Paper>
      <Paper elevation={2} sx={{ p: 3, background: 'rgba(24,25,36,0.97)', borderRadius: 3, border: '1px solid #232336' }}>
        <Typography variant="h5" sx={{ color: '#fbbf24', fontWeight: 700, mb: 2 }}>User Moderation</Typography>
        <Divider sx={{ mb: 3, borderColor: '#fbbf24', opacity: 0.2 }} />
        <ModerationUsersTable />
      </Paper>
    </Box>
  );
}
