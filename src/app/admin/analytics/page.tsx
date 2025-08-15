import React from 'react';
import { Typography, Box, Grid, Paper } from '@mui/material';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import AnalyticsCharts from './AnalyticsCharts';

export default function AnalyticsPage() {
  return (
    <Box>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Analytics' }]} />
      <Typography variant="h4" component="h2" gutterBottom style={{ fontWeight: 800, color: '#38bdf8' }}>
        Analytics
      </Typography>
      <Typography variant="subtitle1" gutterBottom style={{ color: '#a78bfa', marginBottom: 18 }}>
        Site metrics: user signups, active users, review counts, average ratings, and trends.
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, background: 'rgba(56,189,248,0.07)' }}>
            <AnalyticsCharts />
          </Paper>
        </Grid>
        {/* More widgets can be added here */}
      </Grid>
    </Box>
  );
}
