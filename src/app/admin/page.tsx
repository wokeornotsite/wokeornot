import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import styles from './admin.module.css';
import { Typography } from '@mui/material';

export default async function AdminDashboardPage() {
  // Protect route: Only allow admins (stub, will implement real check soon)
  // const session = await getServerSession();
  // if (!session?.user?.role || session.user.role !== 'ADMIN') redirect('/');

  return (
    <div>
      <Typography variant="h3" component="h1" gutterBottom style={{ fontWeight: 900, background: 'linear-gradient(90deg,#e879f9,#a78bfa 50%,#38bdf8 100%)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        Admin Dashboard
      </Typography>
      <Typography variant="h6" style={{ color: '#38bdf8', marginBottom: 24 }}>
        Welcome, Admin! Use the sidebar to moderate, manage content, or view analytics.
      </Typography>
      {/* Quick stats/overview widgets will go here */}
    </div>
  );
}
