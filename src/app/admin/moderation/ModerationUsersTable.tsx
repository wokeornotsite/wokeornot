import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/WarningAmber';

// TODO: Replace with real API data
const rows = [
  { id: '1', email: 'user1@email.com', role: 'USER', status: 'active' },
  { id: '2', email: 'user2@email.com', role: 'USER', status: 'banned' },
  { id: '3', email: 'user3@email.com', role: 'ADMIN', status: 'active' },
];

const columns: GridColDef[] = [
  { field: 'email', headerName: 'Email', flex: 2 },
  { field: 'role', headerName: 'Role', width: 110 },
  { field: 'status', headerName: 'Status', width: 120 },
  {
    field: 'actions',
    type: 'actions',
    headerName: 'Actions',
    width: 130,
    getActions: (params) => [
      <GridActionsCellItem icon={<BlockIcon color="error" />} label="Ban" onClick={() => {}} />, // TODO: implement
      <GridActionsCellItem icon={<WarningIcon color="warning" />} label="Warn" onClick={() => {}} />, // TODO: implement
    ],
  },
];

export default function ModerationUsersTable() {
  return (
    <Box sx={{ height: 270, width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 2, mb: 3 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        disableSelectionOnClick
        sx={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#fff' }}
      />
    </Box>
  );
}
