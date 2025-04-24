import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Typography, Box } from '@mui/material';

// TODO: Replace with real API data
const userData = [
  { date: '2025-04-01', signups: 10, active: 5 },
  { date: '2025-04-02', signups: 17, active: 12 },
  { date: '2025-04-03', signups: 8, active: 7 },
  { date: '2025-04-04', signups: 23, active: 18 },
  { date: '2025-04-05', signups: 14, active: 10 },
];

const reviewData = [
  { date: '2025-04-01', reviews: 5, avgRating: 7.2 },
  { date: '2025-04-02', reviews: 9, avgRating: 6.8 },
  { date: '2025-04-03', reviews: 4, avgRating: 8.1 },
  { date: '2025-04-04', reviews: 12, avgRating: 7.7 },
  { date: '2025-04-05', reviews: 6, avgRating: 8.0 },
];

export default function AnalyticsCharts() {
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
