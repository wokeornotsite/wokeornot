"use client";
import React from 'react';
import { Typography, Box, Paper, Tabs, Tab } from '@mui/material';
import ModerationReviewsTable from './ModerationReviewsTable';
import ModerationCommentsTable from './ModerationCommentsTable';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import { useRouter, useSearchParams } from 'next/navigation';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CommentIcon from '@mui/icons-material/ChatBubbleOutline';

export default function ModerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') ?? '0';

  // User management moved to /admin/users. Redirect old deep links so nothing 404s.
  React.useEffect(() => {
    if (tabParam === '1' || tabParam === 'users') {
      router.replace('/admin/users');
    } else if (tabParam === '2') {
      router.replace('/admin/users?flagged=true');
    }
  }, [tabParam, router]);

  // Local tab: 0 = Reviews, 1 = Comments. Legacy "tab=3" (old Comments index) maps to 1.
  const initialTab = tabParam === '3' ? 1 : 0;
  const [tab, setTab] = React.useState(initialTab);

  function handleTabChange(_: React.SyntheticEvent, value: number) {
    setTab(value);
    router.replace(`?tab=${value}`);
  }

  // While redirecting away (user/flagged links), render nothing to avoid a flash.
  if (tabParam === '1' || tabParam === '2' || tabParam === 'users') return null;

  return (
    <Box sx={{ maxWidth: 1440, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Moderation' }]} />
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 900, background: 'linear-gradient(90deg,#e879f9,#a78bfa 50%,#38bdf8 100%)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        Content Moderation
      </Typography>
      <Typography variant="body1" sx={{ color: '#9ca3af', mb: 3 }}>
        Hide, edit, or delete user reviews and comments. To ban, warn, or change roles, go to{' '}
        <Box component="a" href="/admin/users" sx={{ color: '#38bdf8', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Users</Box>.
      </Typography>

      <Paper elevation={2} sx={{ background: 'rgba(24,25,36,0.97)', borderRadius: 3, border: '1px solid #232336', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: '2px solid #232336',
            '& .MuiTab-root': { color: '#9ca3af', fontWeight: 600, fontSize: 15, textTransform: 'none', minHeight: 52 },
            '& .Mui-selected': { color: '#fbbf24 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#fbbf24', height: 3 },
          }}
        >
          <Tab icon={<RateReviewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Reviews" />
          <Tab icon={<CommentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Comments" />
        </Tabs>

        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
          {tab === 0 && <ModerationReviewsTable />}
          {tab === 1 && <ModerationCommentsTable />}
        </Box>
      </Paper>
    </Box>
  );
}
