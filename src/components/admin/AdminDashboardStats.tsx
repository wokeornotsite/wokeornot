"use client";

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import PeopleIcon from '@mui/icons-material/People';
import RateReviewIcon from '@mui/icons-material/RateReview';
import MovieIcon from '@mui/icons-material/Movie';
import StarIcon from '@mui/icons-material/Star';
import BlockIcon from '@mui/icons-material/Block';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface AdminDashboardStatsProps {
  userCount: number;
  reviewCount: number;
  contentCount: number;
  avgRating: number;
  bannedUserCount: number;
  hiddenReviewCount: number;
  weeklyUsers?: number;
  weeklyReviews?: number;
}

export default function AdminDashboardStats({
  userCount,
  reviewCount,
  contentCount,
  avgRating,
  bannedUserCount,
  hiddenReviewCount,
  weeklyUsers,
  weeklyReviews,
}: AdminDashboardStatsProps) {
  const stats = [
    {
      title: 'Total Users',
      value: userCount,
      icon: <PeopleIcon sx={{ fontSize: 40, color: '#38bdf8' }} />,
      color: 'rgba(56, 189, 248, 0.15)',
      textColor: '#38bdf8',
      trend: weeklyUsers !== undefined ? weeklyUsers : undefined,
    },
    {
      title: 'Total Reviews',
      value: reviewCount,
      icon: <RateReviewIcon sx={{ fontSize: 40, color: '#a78bfa' }} />,
      color: 'rgba(167, 139, 250, 0.15)',
      textColor: '#a78bfa',
      trend: weeklyReviews !== undefined ? weeklyReviews : undefined,
    },
    {
      title: 'Content Items',
      value: contentCount,
      icon: <MovieIcon sx={{ fontSize: 40, color: '#e879f9' }} />,
      color: 'rgba(232, 121, 249, 0.15)',
      textColor: '#e879f9',
      trend: undefined,
    },
    {
      title: 'Avg Rating',
      value: avgRating.toFixed(1),
      icon: <StarIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
      color: 'rgba(245, 158, 11, 0.15)',
      textColor: '#f59e0b',
      trend: undefined,
    },
    {
      title: 'Banned Users',
      value: bannedUserCount,
      icon: <BlockIcon sx={{ fontSize: 40, color: '#ef4444' }} />,
      color: 'rgba(239, 68, 68, 0.12)',
      textColor: '#ef4444',
      trend: undefined,
    },
    {
      title: 'Hidden Reviews',
      value: hiddenReviewCount,
      icon: <VisibilityOffIcon sx={{ fontSize: 40, color: '#9ca3af' }} />,
      color: 'rgba(156, 163, 175, 0.12)',
      textColor: '#9ca3af',
      trend: undefined,
    },
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid key={index} item xs={12} sm={6} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 2,
              height: '100%',
              background: stat.color,
              border: `1px solid ${stat.textColor}20`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 16px -2px ${stat.textColor}30`,
              },
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: stat.textColor }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, mt: 1 }}>
                  {stat.title}
                </Typography>
                {stat.trend !== undefined && (
                  <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 600, mt: 0.5, display: 'block' }}>
                    +{stat.trend} this week
                  </Typography>
                )}
              </Box>
              <Box>{stat.icon}</Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
