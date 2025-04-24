"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/WarningAmber';

import { useUsers } from './useUsers';
import Snackbar from '@mui/material/Snackbar';

export default function ModerationUsersTable() {
  const { users, isLoading, error, mutate } = useUsers();
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });

  async function handleBan(row: any) {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, role: 'BANNED' }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BAN_USER', targetId: row.id, targetType: 'User', details: row.email }),
      });
      setSnackbar({ open: true, message: 'User banned' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error banning user' });
    }
  }
  async function handleWarn(row: any) {
    await fetch('/api/admin/auditlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'WARN_USER', targetId: row.id, targetType: 'User', details: row.email }),
    });
    setSnackbar({ open: true, message: 'User warned (logged only)' });
  }
  async function handlePromote(row: any) {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, role: 'ADMIN' }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PROMOTE_ADMIN', targetId: row.id, targetType: 'User', details: row.email }),
      });
      setSnackbar({ open: true, message: 'User promoted to admin' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error promoting user' });
    }
  }
  const columns: GridColDef[] = [
    { field: 'email', headerName: 'Email', flex: 2 },
    { field: 'role', headerName: 'Role', width: 110 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 200,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem icon={<BlockIcon color="error" />} label="Ban" onClick={() => handleBan(params.row)} />,
          <GridActionsCellItem icon={<WarningIcon color="warning" />} label="Warn" onClick={() => handleWarn(params.row)} />,
        ];
        if (params.row.role !== 'ADMIN') {
          actions.push(
            <GridActionsCellItem
              icon={<span style={{ fontWeight: 700, color: '#38bdf8' }}>A</span>}
              label="Promote to Admin"
              onClick={() => handlePromote(params.row)}
              showInMenu
            />
          );
        }
        return actions;
      },
    },
  ];

  return (
    <Box sx={{ height: 270, width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 2, mb: 3 }}>
      <DataGrid
        rows={users}
        columns={columns}
        pageSizeOptions={[5]}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        loading={isLoading}
        disableRowSelectionOnClick
        sx={{
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
          fontSize: 16,
          color: '#f3f4f6',
          background: '#18181b',
          borderRadius: 2,
          boxShadow: '0 2px 12px #0002',
          '& .MuiDataGrid-cell': { color: '#f3f4f6', background: '#18181b' },
          '& .MuiDataGrid-columnHeaderTitle': { color: '#a78bfa', fontWeight: 700 },
          '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#232336' },
          '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#18181b' },
          '& .MuiDataGrid-footerContainer': { background: '#232336', color: '#f3f4f6' },
        }}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Box>
  );
}
