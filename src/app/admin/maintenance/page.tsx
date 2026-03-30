"use client";

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, TextField, Divider, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import SearchIcon from '@mui/icons-material/Search';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import { useSnackbar } from 'notistack';

interface ScanResult {
  totalScanned: number;
  malformedCount: number;
  orphanedCount: number;
  toDeleteCount: number;
  sample: {
    malformed: { id: string; contentId: string | null }[];
    orphaned: { id: string; contentId: string | null }[];
  };
  ids: string[];
}

export default function AdminMaintenancePage() {
  const { enqueueSnackbar } = useSnackbar();
  const [limit, setLimit] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [deleting, setDeleting] = useState(false);

  const scan = async () => {
    try {
      setLoading(true);
      setResult(null);
      const q = new URLSearchParams();
      if (limit && Number(limit) > 0) q.set('limit', String(Number(limit)));
      const res = await fetch(`/api/admin/reviews/maintenance${q.toString() ? `?${q.toString()}` : ''}`);
      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      setResult(data);
      enqueueSnackbar('Scan complete', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to scan reviews', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const purge = async () => {
    if (!result || !result.ids.length) {
      enqueueSnackbar('No bad reviews found to delete', { variant: 'info' });
      return;
    }
    if (typeof window !== 'undefined') {
      const ok = window.confirm(`Permanently delete ${result.ids.length} bad reviews? This cannot be undone.`);
      if (!ok) return;
    }
    try {
      setDeleting(true);
      const res = await fetch('/api/admin/reviews/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: result.ids }),
      });
      if (!res.ok) throw new Error('Delete failed');
      const data = await res.json();
      enqueueSnackbar(`Deleted ${data.deleted} bad reviews`, { variant: 'success' });
      setResult(null);
    } catch {
      enqueueSnackbar('Failed to delete reviews', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const statCards = result ? [
    { label: 'Total Scanned', value: result.totalScanned, color: '#38bdf8' },
    { label: 'Malformed IDs', value: result.malformedCount, color: result.malformedCount > 0 ? '#ef4444' : '#22c55e' },
    { label: 'Orphaned Reviews', value: result.orphanedCount, color: result.orphanedCount > 0 ? '#f97316' : '#22c55e' },
    { label: 'Total to Delete', value: result.toDeleteCount, color: result.toDeleteCount > 0 ? '#ef4444' : '#22c55e' },
  ] : [];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Maintenance' }]} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <BuildIcon sx={{ fontSize: 36, color: '#a78bfa' }} />
        <Typography variant="h3" component="h1" sx={{ fontWeight: 900, background: 'linear-gradient(90deg,#a78bfa,#38bdf8 100%)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Maintenance
        </Typography>
      </Box>

      {/* Explainer */}
      <Paper elevation={0} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 2, mb: 3, background: 'rgba(56,189,248,0.07)', border: '1px solid #38bdf833', borderRadius: 2 }}>
        <InfoOutlinedIcon sx={{ color: '#38bdf8', mt: 0.3, flexShrink: 0 }} />
        <Box>
          <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 600, mb: 0.5 }}>What does this tool do?</Typography>
          <Typography variant="body2" sx={{ color: '#d1d5db' }}>
            This tool scans all reviews in the database and identifies two types of bad data:
          </Typography>
          <Box component="ul" sx={{ color: '#d1d5db', mt: 0.5, mb: 0, pl: 2.5 }}>
            <li><Typography variant="body2" component="span" sx={{ color: '#d1d5db' }}><strong style={{ color: '#f87171' }}>Malformed</strong> — reviews with a contentId that is not a valid database ID (corrupt data)</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ color: '#d1d5db' }}><strong style={{ color: '#fb923c' }}>Orphaned</strong> — reviews pointing to content that has been deleted</Typography></li>
          </Box>
          <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
            These bad reviews can cause display errors on content pages. Run a scan first to see what would be removed, then delete them if needed.
          </Typography>
        </Box>
      </Paper>

      {/* Scan tool */}
      <Paper sx={{ p: 3, mb: 3, background: 'rgba(24,25,36,0.97)', border: '1px solid #232336', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ color: '#a78bfa', fontWeight: 700, mb: 0.5 }}>Step 1 — Scan for Bad Reviews</Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
          Optionally limit how many reviews are scanned (leave blank to scan all). The scan is read-only and makes no changes.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Scan limit (optional)"
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            placeholder="e.g. 1000"
            sx={{ input: { color: '#e2e8f0' }, label: { color: '#9ca3af' }, width: 200 }}
          />
          <Button
            variant="contained"
            onClick={scan}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SearchIcon />}
            sx={{ background: '#a78bfa', '&:hover': { background: '#9061e8' }, minWidth: 120 }}
          >
            {loading ? 'Scanning…' : 'Run Scan'}
          </Button>
        </Box>
      </Paper>

      {/* Scan results */}
      {result && (
        <Paper sx={{ p: 3, mb: 3, background: 'rgba(24,25,36,0.97)', border: '1px solid #232336', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ color: '#38bdf8', fontWeight: 700, mb: 2 }}>Scan Results</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
            {statCards.map((card) => (
              <Paper key={card.label} elevation={0} sx={{ p: 2, background: `${card.color}12`, border: `1px solid ${card.color}33`, borderRadius: 2 }}>
                <Typography variant="h4" sx={{ color: card.color, fontWeight: 800 }}>{card.value}</Typography>
                <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>{card.label}</Typography>
              </Paper>
            ))}
          </Box>

          {result.toDeleteCount === 0 ? (
            <Alert severity="success" sx={{ mb: 2 }}>No bad reviews found. Your database looks clean!</Alert>
          ) : (
            <>
              {result.sample.malformed.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ color: '#f87171', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WarningAmberIcon fontSize="small" /> Sample Malformed Reviews
                  </Typography>
                  <List dense sx={{ background: 'rgba(239,68,68,0.05)', borderRadius: 1, mb: 2 }}>
                    {result.sample.malformed.map((r) => (
                      <ListItem key={`m-${r.id}`}>
                        <ListItemText
                          primary={<span style={{ color: '#fca5a5', fontFamily: 'monospace', fontSize: 13 }}>ID: {r.id}</span>}
                          secondary={<span style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: 12 }}>contentId: {r.contentId ?? 'null'}</span>}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {result.sample.orphaned.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ color: '#fb923c', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WarningAmberIcon fontSize="small" /> Sample Orphaned Reviews
                  </Typography>
                  <List dense sx={{ background: 'rgba(249,115,22,0.05)', borderRadius: 1, mb: 2 }}>
                    {result.sample.orphaned.map((r) => (
                      <ListItem key={`o-${r.id}`}>
                        <ListItemText
                          primary={<span style={{ color: '#fdba74', fontFamily: 'monospace', fontSize: 13 }}>ID: {r.id}</span>}
                          secondary={<span style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: 12 }}>contentId: {r.contentId ?? 'null'}</span>}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </Paper>
      )}

      {/* Danger zone */}
      <Paper sx={{ p: 3, background: 'rgba(239,68,68,0.05)', border: '1px solid #ef444444', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon /> Danger Zone — Step 2: Delete Bad Reviews
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
          This permanently deletes all bad reviews identified by the scan above. Run a scan first. <strong style={{ color: '#fca5a5' }}>This action cannot be undone.</strong>
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={purge}
          disabled={deleting || !result || !result.ids.length}
          startIcon={deleting ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <DeleteForeverIcon />}
          sx={{ minWidth: 200 }}
        >
          {deleting ? 'Deleting…' : `Delete ${result?.ids.length || 0} Bad Reviews`}
        </Button>
      </Paper>
    </Box>
  );
}
