import { requireAdmin } from '@/lib/admin-auth';
import MaintenanceClient from './MaintenanceClient';

export default async function AdminMaintenancePage() {
  // Admin-only: bypass the staff-level layout guard with a stricter check.
  await requireAdmin();
  return <MaintenanceClient />;
}
