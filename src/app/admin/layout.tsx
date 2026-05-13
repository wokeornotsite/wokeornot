import React from 'react';
import AdminSidebar from './AdminSidebar';
import styles from './admin.module.css';
import AdminSnackbarProvider from '@/components/admin/AdminSnackbarProvider';
import AdminSearchBar from '@/components/admin/AdminSearchBar';
import { requireStaff, isAdmin } from '@/lib/admin-auth';
import { CircularProgress, Box } from '@mui/material';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Protect all admin routes (staff = ADMIN + MODERATOR; finer ADMIN-only
  // gating happens on individual pages and API routes).
  const session = await requireStaff();
  const admin = isAdmin(session);

  return (
    <div className={styles.adminRoot}>
      <AdminSidebar isAdmin={admin} />
      <AdminSnackbarProvider>
        <main className={styles.adminMain}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <AdminSearchBar />
          </Box>
          <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress sx={{ color: '#38bdf8' }} /></Box>}>
            {children}
          </React.Suspense>
        </main>
      </AdminSnackbarProvider>
    </div>
  );
}
