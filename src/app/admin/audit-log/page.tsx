import React from 'react';
import { Typography, Box, Paper, Divider } from '@mui/material';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import AuditLogTable from './AuditLogTable';

export default function AuditLogPage() {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Log' }]} />
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 900, background: 'linear-gradient(90deg,#e879f9,#a78bfa 50%,#38bdf8 100%)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        Audit Log
      </Typography>
      <Typography variant="h6" sx={{ color: '#38bdf8', mb: 4 }}>
        Track all admin actions — bans, deletions, promotions, and more.
      </Typography>
      <Paper elevation={2} sx={{ p: 3, background: 'rgba(24,25,36,0.97)', borderRadius: 3, border: '1px solid #232336' }}>
        <Typography variant="h5" sx={{ color: '#fbbf24', fontWeight: 700, mb: 2 }}>Admin Actions</Typography>
        <Divider sx={{ mb: 3, borderColor: '#fbbf24', opacity: 0.2 }} />
        <AuditLogTable />
      </Paper>
    </Box>
  );
}
