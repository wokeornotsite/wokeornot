'use client';

import React from 'react';
import useSWR from 'swr';
import { Box, Typography, Paper, Grid, CircularProgress, Chip } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

type InsightsResponse = {
  hiddenReviewsByDay: { date: string; count: number }[];
  actionsByAdmin: { adminId: string; email: string; name: string | null; count: number }[];
  topReviewersThisMonth: { userId: string | null; email: string; name: string | null; reviewCount: number }[];
  windowDays: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardInsights() {
  const { data, isLoading, error } = useSWR<InsightsResponse>('/api/admin/dashboard-insights', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress sx={{ color: '#38bdf8' }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Paper sx={{ p: 3, background: 'rgba(24,25,36,0.95)', border: '1px solid #ef444433', borderRadius: 2 }}>
        <Typography sx={{ color: '#ef4444' }}>Failed to load insights.</Typography>
      </Paper>
    );
  }

  const hiddenTotal = data.hiddenReviewsByDay.reduce((sum, d) => sum + d.count, 0);
  const actionsTotal = data.actionsByAdmin.reduce((sum, a) => sum + a.count, 0);

  return (
    <Box>
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h5" component="h2" style={{ fontWeight: 700, color: '#22c55e' }}>
          Moderation Health
        </Typography>
        <Typography variant="body2" style={{ color: '#9ca3af', marginBottom: 16 }}>
          Last {data.windowDays} days of moderation activity
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2.5, background: 'rgba(24,25,36,0.95)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f97316' }}>Reviews hidden / day</Typography>
              <Chip label={`${hiddenTotal} total`} size="small" sx={{ background: '#f9731622', color: '#f97316', fontWeight: 700 }} />
            </Box>
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.hiddenReviewsByDay} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#232336" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#191927', border: '1px solid #232336', color: '#fff' }} />
                  <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2.5, background: 'rgba(24,25,36,0.95)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#38bdf8' }}>Actions per admin</Typography>
              <Chip label={`${actionsTotal} total`} size="small" sx={{ background: '#38bdf822', color: '#38bdf8', fontWeight: 700 }} />
            </Box>
            <Box sx={{ height: 220 }}>
              {data.actionsByAdmin.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 14 }}>
                  No admin actions in the last {data.windowDays} days
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.actionsByAdmin} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="#232336" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="email"
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 10) + '…' : v)}
                    />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#191927', border: '1px solid #232336', color: '#fff' }} />
                    <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2.5, background: 'rgba(24,25,36,0.95)', border: '1px solid rgba(168,139,250,0.2)', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#a78bfa', mb: 1.5 }}>
              Top reviewers this month
            </Typography>
            {data.topReviewersThisMonth.length === 0 ? (
              <Typography sx={{ color: '#9ca3af', fontSize: 14 }}>No reviews yet this month.</Typography>
            ) : (
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0', fontSize: 14 }}>
                <Box component="thead" sx={{ borderBottom: '1px solid #232336' }}>
                  <Box component="tr">
                    <Box component="th" sx={{ textAlign: 'left', py: 1, color: '#9ca3af', fontWeight: 600 }}>Email</Box>
                    <Box component="th" sx={{ textAlign: 'left', py: 1, color: '#9ca3af', fontWeight: 600 }}>Name</Box>
                    <Box component="th" sx={{ textAlign: 'right', py: 1, color: '#9ca3af', fontWeight: 600 }}>Reviews</Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  {data.topReviewersThisMonth.map((r) => (
                    <Box component="tr" key={r.userId ?? r.email} sx={{ borderBottom: '1px solid #1a1a2e' }}>
                      <Box component="td" sx={{ py: 1 }}>{r.email}</Box>
                      <Box component="td" sx={{ py: 1, color: '#9ca3af' }}>{r.name || '—'}</Box>
                      <Box component="td" sx={{ py: 1, textAlign: 'right', fontWeight: 700, color: '#a78bfa' }}>{r.reviewCount}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
