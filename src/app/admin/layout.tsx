import React from 'react';
import AdminSidebar from './AdminSidebar';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminRoot}>
      <AdminSidebar />
      <main className={styles.adminMain}>{children}</main>
    </div>
  );
}
