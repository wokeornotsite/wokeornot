import { Box, Typography } from '@mui/material';
import AdminBreadcrumbs from '@/components/admin/AdminBreadcrumbs';
import UserIntelligenceTable from './UserIntelligenceTable';

export const metadata = { title: 'User Intelligence | WokeOrNot Admin' };

export default function AdminUsersPage() {
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <AdminBreadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]} />
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', mb: 3, mt: 1 }}>
        User Intelligence
      </Typography>
      <UserIntelligenceTable />
    </Box>
  );
}
