import React from 'react';
import { Typography, Box } from '@mui/material';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import ModerationUsersTable from '../moderation/ModerationUsersTable';

export default function AdminUsersPage() {
  return (
    <Box>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]} />
      <Typography variant="h4" component="h2" gutterBottom style={{ fontWeight: 800, color: '#e879f9' }}>
        Users
      </Typography>
      <Typography variant="subtitle1" gutterBottom style={{ color: '#a78bfa', marginBottom: 18 }}>
        View all users, manage roles, ban or warn users.
      </Typography>
      <ModerationUsersTable />
    </Box>
  );
}
