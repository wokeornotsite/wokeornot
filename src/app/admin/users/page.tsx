import { Box, Typography } from '@mui/material';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import UserIntelligenceTable from './UserIntelligenceTable';
import { requireStaff, isAdmin } from '@/lib/admin-auth';

export const metadata = { title: 'Users | WokeOrNot Admin' };

export default async function AdminUsersPage() {
  const session = await requireStaff();
  const admin = isAdmin(session);
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]} />
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', mt: 1 }}>
        Users
      </Typography>
      <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
        Search, review activity, and moderate users. Use “Flagged only” to see banned or warned accounts.
      </Typography>
      <UserIntelligenceTable isAdmin={admin} />
    </Box>
  );
}
