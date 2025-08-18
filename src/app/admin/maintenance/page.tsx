"use client";

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, TextField, Divider, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
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
  const [limit, setLimit] = useState<string>("");
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
    } catch (e) {
      enqueueSnackbar('Failed to scan reviews', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const purge = async () => {
    if (!result || !result.ids.length) {
      enqueueSnackbar('No IDs to delete', { variant: 'info' });
      return;
    }
    if (typeof window !== 'undefined') {
      const ok = window.confirm(`Delete ${result.ids.length} bad reviews? This cannot be undone.`);
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
      enqueueSnackbar(`Deleted ${data.deleted} reviews`, { variant: 'success' });
      // Clear result after deletion
      setResult(null);
    } catch (e) {
      enqueueSnackbar('Failed to delete reviews', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ color: '#f3f4f6', mb: 2 }}>Admin Maintenance</Typography>
      <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="subtitle1" sx={{ color: '#e2e8f0', mb: 1 }}>
          Scan for malformed or orphaned reviews
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField 
            label="Scan Limit (optional)"
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ input: { color: '#e2e8f0' }, label: { color: '#9ca3af' } }}
          />
          <Button variant="contained" onClick={scan} disabled={loading}>
            {loading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Scan'}
          </Button>
          <Button variant="outlined" color="error" onClick={purge} disabled={deleting || !result || !result.ids.length}>
            {deleting ? <CircularProgress size={18} /> : `Delete (${result?.ids.length || 0})`}
          </Button>
        </Box>
        {result && (
          <Box>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              Total scanned: {result.totalScanned}
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              Malformed contentId: {result.malformedCount}
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              Orphaned (missing content): {result.orphanedCount}
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
              Unique to delete: {result.toDeleteCount}
            </Typography>

            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

            <Typography variant="subtitle2" sx={{ color: '#e2e8f0', mb: 1 }}>Sample Malformed</Typography>
            <List dense>
              {result.sample.malformed.map((r) => (
                <ListItem key={`m-${r.id}`} sx={{ color: '#e2e8f0' }}>
                  <ListItemText primary={`ID: ${r.id}`} secondary={`contentId: ${r.contentId ?? 'null'}`} />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" sx={{ color: '#e2e8f0', my: 1 }}>Sample Orphaned</Typography>
            <List dense>
              {result.sample.orphaned.map((r) => (
                <ListItem key={`o-${r.id}`} sx={{ color: '#e2e8f0' }}>
                  <ListItemText primary={`ID: ${r.id}`} secondary={`contentId: ${r.contentId ?? 'null'}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
