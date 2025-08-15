import React from 'react';
import { Typography, Box } from '@mui/material';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import ContentMoviesTable from './ContentMoviesTable';
import ContentReviewsTable from './ContentReviewsTable';

export default function ContentManagementPage() {
  return (
    <Box>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Content' }]} />
      <Typography variant="h4" component="h2" gutterBottom style={{ fontWeight: 800, color: '#38bdf8' }}>
        Content Management
      </Typography>
      <Typography variant="subtitle1" gutterBottom style={{ color: '#a78bfa', marginBottom: 18 }}>
        Edit or remove movies, shows, and reviews. Manage categories and featured content.
      </Typography>
      <ContentMoviesTable />
      <Box mt={5} />
      <ContentReviewsTable />
    </Box>
  );
}
