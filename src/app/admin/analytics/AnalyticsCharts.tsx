"use client";
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Typography, Box, ToggleButtonGroup, ToggleButton, Card, CardContent, CircularProgress, Button } from '@mui/material';
import { useAnalytics } from './useAnalytics';

const RANGE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

export default function AnalyticsCharts() {
  const [days, setDays] = React.useState(30);
  const { analytics, isLoading, error, mutate } = useAnalytics(days);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress sx={{ color: '#38bdf8' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
        <Typography color="error">Error loading analytics.</Typography>
        <Button variant="outlined" sx={{ color: '#38bdf8', borderColor: '#38bdf8' }} onClick={() => mutate()}>
          Retry
        </Button>
      </Box>
    );
  }

  const userData: any[] = analytics?.userData || [];
  const reviewData: any[] = analytics?.reviewData || [];
  const topReviewed: any[] = analytics?.topReviewed || [];
  const topWoke: any[] = analytics?.topWoke || [];

  const totalSignups = userData.reduce((sum, d) => sum + (d.signups || 0), 0);
  const totalReviews = reviewData.reduce((sum, d) => sum + (d.reviews || 0), 0);
  const ratedDays = reviewData.filter(d => d.reviews > 0);
  const avgWokeScore = ratedDays.length
    ? (ratedDays.reduce((sum, d) => sum + d.avgRating * d.reviews, 0) / ratedDays.reduce((sum, d) => sum + d.reviews, 0)).toFixed(1)
    : '—';
  const peakDay = userData.reduce((best, d) => (d.signups > (best?.signups || 0) ? d : best), null as any);

  return (
    <Box>
      {/* Date range selector */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={days}
          exclusive
          onChange={(_, val) => { if (val) setDays(val); }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': { color: '#9ca3af', borderColor: '#37376b' },
            '& .Mui-selected': { color: '#38bdf8 !important', borderColor: '#38bdf8 !important', background: 'rgba(56,189,248,0.1) !important' },
          }}
        >
          {RANGE_OPTIONS.map(opt => (
            <ToggleButton key={opt.value} value={opt.value}>{opt.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        <Card sx={{ background: 'rgba(232,121,249,0.08)', border: '1px solid #e879f933' }}>
          <CardContent sx={{ p: '12px !important' }}>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>Total Signups</Typography>
            <Typography variant="h5" sx={{ color: '#e879f9', fontWeight: 700 }}>{totalSignups}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ background: 'rgba(56,189,248,0.08)', border: '1px solid #38bdf833' }}>
          <CardContent sx={{ p: '12px !important' }}>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>Total Reviews</Typography>
            <Typography variant="h5" sx={{ color: '#38bdf8', fontWeight: 700 }}>{totalReviews}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ background: 'rgba(167,139,250,0.08)', border: '1px solid #a78bfa33' }}>
          <CardContent sx={{ p: '12px !important' }}>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>Avg Woke Score</Typography>
            <Typography variant="h5" sx={{ color: '#a78bfa', fontWeight: 700 }}>{avgWokeScore}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ background: 'rgba(251,191,36,0.08)', border: '1px solid #fbbf2433' }}>
          <CardContent sx={{ p: '12px !important' }}>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>Peak Signup Day</Typography>
            <Typography variant="h5" sx={{ color: '#fbbf24', fontWeight: 700 }}>
              {peakDay?.signups > 0 ? peakDay.date : '—'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Charts */}
      <Typography variant="subtitle2" sx={{ mb: 1, color: '#38bdf8' }}>User Signups (Last {days} Days)</Typography>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={userData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: 'Users', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="signups" stroke="#e879f9" strokeWidth={2} name="New Signups" />
        </LineChart>
      </ResponsiveContainer>

      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, color: '#a78bfa' }}>Reviews & Average Rating</Typography>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={reviewData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" label={{ value: 'Reviews', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="reviews" fill="#38bdf8" barSize={18} />
          <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#e879f9" strokeWidth={2} />
        </BarChart>
      </ResponsiveContainer>

      {/* Top Content Lists */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mt: 4 }}>
        {/* Top 10 Most Reviewed */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#38bdf8', fontWeight: 700 }}>Top 10 Most Reviewed</Typography>
          {topReviewed.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>No data yet</Typography>
          ) : (
            topReviewed.map((item: any, idx: number) => (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75, py: 0.5, px: 1, borderRadius: 1, background: 'rgba(56,189,248,0.05)', '&:hover': { background: 'rgba(56,189,248,0.1)' } }}>
                <Box sx={{ minWidth: 22, height: 22, borderRadius: '50%', background: '#38bdf820', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.65rem' }}>{idx + 1}</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{item.title}</Typography>
                <Box sx={{ px: 0.75, py: 0.25, borderRadius: 0.75, background: '#38bdf815', flexShrink: 0 }}>
                  <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.65rem' }}>{item.contentType}</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, flexShrink: 0, minWidth: 40, textAlign: 'right' }}>{item.reviewCount} rev</Typography>
              </Box>
            ))
          )}
        </Box>

        {/* Top 10 Most Woke */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#e879f9', fontWeight: 700 }}>Top 10 Most Woke</Typography>
          {topWoke.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>No data yet</Typography>
          ) : (
            topWoke.map((item: any, idx: number) => (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75, py: 0.5, px: 1, borderRadius: 1, background: 'rgba(232,121,249,0.05)', '&:hover': { background: 'rgba(232,121,249,0.1)' } }}>
                <Box sx={{ minWidth: 22, height: 22, borderRadius: '50%', background: '#e879f920', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography variant="caption" sx={{ color: '#e879f9', fontWeight: 700, fontSize: '0.65rem' }}>{idx + 1}</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{item.title}</Typography>
                <Box sx={{ px: 0.75, py: 0.25, borderRadius: 0.75, background: '#e879f915', flexShrink: 0 }}>
                  <Typography variant="caption" sx={{ color: '#e879f9', fontWeight: 600, fontSize: '0.65rem' }}>{item.contentType}</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, flexShrink: 0, minWidth: 40, textAlign: 'right' }}>{Number(item.wokeScore).toFixed(1)}/10</Typography>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}
