import React from 'react';
import AdminSidebar from './AdminSidebar';
import styles from './admin.module.css';
import AdminSnackbarProvider from '@/components/admin/AdminSnackbarProvider';
import { requireAdmin } from '@/lib/admin-auth';
import { CircularProgress, Box } from '@mui/material';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Protect all admin routes
  await requireAdmin();

  return (
    <div className={styles.adminRoot}>
      <AdminSidebar />
      <AdminSnackbarProvider>
        <main className={styles.adminMain}>
          <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress sx={{ color: '#38bdf8' }} /></Box>}>
            {children}
          </React.Suspense>
        </main>
      </AdminSnackbarProvider>
    </div>
  );
}
