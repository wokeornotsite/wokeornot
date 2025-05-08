import React from 'react';
import AdminSidebar from './AdminSidebar';
import styles from './admin.module.css';
import AdminSnackbarProvider from '@/components/admin/AdminSnackbarProvider';
import { requireAdmin } from '@/lib/admin-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Protect all admin routes
  await requireAdmin();
  
  return (
    <div className={styles.adminRoot}>
      <AdminSidebar />
      <AdminSnackbarProvider>
        <main className={styles.adminMain}>{children}</main>
      </AdminSnackbarProvider>
    </div>
  );
}
