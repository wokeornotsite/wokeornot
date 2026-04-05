"use client";
import React from 'react';
import useSWR from 'swr';
import { Typography, Box, Paper, Tabs, Tab, Badge } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ModerationReviewsTable from './ModerationReviewsTable';
import ModerationUsersTable from './ModerationUsersTable';
import FlaggedUsersTable from './FlaggedUsersTable';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import { useRouter, useSearchParams } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ModerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = parseInt(searchParams.get('tab') || '0', 10);
  const [tab, setTab] = React.useState(isNaN(tabParam) ? 0 : Math.min(tabParam, 2));

  const { data: flaggedData } = useSWR('/api/admin/users?flagged=true&pageSize=1', fetcher);
  const flaggedCount: number = flaggedData?.total ?? 0;

  function handleTabChange(_: React.SyntheticEvent, value: number) {
    setTab(value);
    router.replace(`?tab=${value}`);
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Moderation' }]} />
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 900, background: 'linear-gradient(90deg,#e879f9,#a78bfa 50%,#38bdf8 100%)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        Moderation Tools
      </Typography>
      <Typography variant="h6" sx={{ color: '#38bdf8', mb: 3 }}>
        Hide or delete reviews. Ban, warn, promote, or demote users.
      </Typography>

      <Paper elevation={2} sx={{ background: 'rgba(24,25,36,0.97)', borderRadius: 3, border: '1px solid #232336', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{
            borderBottom: '2px solid #232336',
            '& .MuiTab-root': { color: '#9ca3af', fontWeight: 600, fontSize: 15, textTransform: 'none', minHeight: 52 },
            '& .Mui-selected': { color: '#fbbf24 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#fbbf24', height: 3 },
          }}
        >
          <Tab label="Review Moderation" />
          <Tab label="User Moderation" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmberIcon sx={{ fontSize: 18 }} />
                <Badge
                  badgeContent={flaggedCount}
                  color="warning"
                  max={99}
                  sx={{ '& .MuiBadge-badge': { fontSize: 11, fontWeight: 700 } }}
                >
                  <span>Flagged Users</span>
                </Badge>
              </Box>
            }
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && <ModerationReviewsTable />}
          {tab === 1 && <ModerationUsersTable />}
          {tab === 2 && <FlaggedUsersTable />}
        </Box>
      </Paper>
    </Box>
  );
}
