import React from 'react';
import { Typography, Box } from '@mui/material';
import ModerationReviewsTable from './ModerationReviewsTable';
import ModerationUsersTable from './ModerationUsersTable';

export default function ModerationPage() {
  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom style={{ fontWeight: 800, color: '#e879f9' }}>
        Moderation Tools
      </Typography>
      <Typography variant="subtitle1" gutterBottom style={{ color: '#a78bfa', marginBottom: 18 }}>
        Review, approve, hide, or delete content. Ban or warn users as needed.
      </Typography>
      <ModerationReviewsTable />
      <Box mt={5} />
      <ModerationUsersTable />
    </Box>
  );
}
