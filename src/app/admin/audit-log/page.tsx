'use client';
import React from 'react';
import { Typography, Box, Paper, Divider } from '@mui/material';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import AuditLogTable from './AuditLogTable';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function AuditLogPage() {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Log' }]} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <HistoryIcon sx={{ fontSize: 38, color: '#fbbf24' }} />
        <Typography variant="h3" component="h1" sx={{ fontWeight: 900, background: 'linear-gradient(90deg,#fbbf24,#e879f9 60%,#38bdf8 100%)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Audit Log
        </Typography>
      </Box>

      {/* Explainer callout */}
      <Paper elevation={0} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 2, mb: 3, background: 'rgba(251,191,36,0.07)', border: '1px solid #fbbf2433', borderRadius: 2 }}>
        <InfoOutlinedIcon sx={{ color: '#fbbf24', mt: 0.3, flexShrink: 0 }} />
        <Box>
          <Typography variant="body2" sx={{ color: '#fbbf24', fontWeight: 600, mb: 0.5 }}>What is the Audit Log?</Typography>
          <Typography variant="body2" sx={{ color: '#d1d5db' }}>
            Every admin action — bans, deletions, promotions, warnings, and content changes — is automatically recorded here with a timestamp and the admin who performed it. Use the filters to investigate specific users, content, or action types.
          </Typography>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, background: 'rgba(24,25,36,0.97)', borderRadius: 3, border: '1px solid #232336' }}>
        <Typography variant="h5" sx={{ color: '#fbbf24', fontWeight: 700, mb: 2 }}>Admin Actions</Typography>
        <Divider sx={{ mb: 3, borderColor: '#fbbf24', opacity: 0.2 }} />
        <AuditLogTable />
      </Paper>
    </Box>
  );
}
