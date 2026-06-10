import React from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { requireStaff, isAdmin } from '@/lib/admin-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Protect all admin routes (staff = ADMIN + MODERATOR; finer ADMIN-only
  // gating happens on individual pages and API routes).
  const session = await requireStaff();
  const admin = isAdmin(session);

  return <AdminShell isAdmin={admin}>{children}</AdminShell>;
}
