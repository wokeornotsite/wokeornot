"use client";
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Typography, Box } from '@mui/material';

import { useAnalytics } from './useAnalytics';

export default function AnalyticsCharts() {
  const { analytics, isLoading, error } = useAnalytics();
  if (isLoading) return <div>Loading analytics...</div>;
  if (error) return <div>Error loading analytics.</div>;
  const userData = analytics?.userData || [];
  const reviewData = analytics?.reviewData || [];

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, color: '#38bdf8' }}>User Signups & Active Users</Typography>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={userData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="signups" stroke="#e879f9" strokeWidth={2} />
          <Line type="monotone" dataKey="active" stroke="#38bdf8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, color: '#a78bfa' }}>Reviews & Average Rating</Typography>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={reviewData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="reviews" fill="#38bdf8" barSize={18} />
          <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#e879f9" strokeWidth={2} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
