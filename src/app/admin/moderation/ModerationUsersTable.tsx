"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';

import { useUsers } from './useUsers';
import Snackbar from '@mui/material/Snackbar';

export default function ModerationUsersTable() {
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
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
      width: 240,
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
        actions.push(
          <GridActionsCellItem
            icon={<DeleteIcon color="error" />}
            label="Delete"
            onClick={() => setDeleteDialog({ open: true, userId: params.row.id })}
            showInMenu
          />
        );
        return actions;
      },
    },
  ];

  async function handleDelete(userId: string) {
    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      setSnackbar({ open: true, message: 'User deleted' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting user' });
    }
    setDeleteDialog({ open: false, userId: null });
  }

  return (
    <Box sx={{ height: 600, width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, mb: 3 }}>
      <DataGrid
        rows={users}
        columns={columns}
        pageSizeOptions={[10, 20, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        autoHeight={false}
        loading={isLoading}
        disableRowSelectionOnClick
        sx={{
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
          fontSize: 16,
          color: '#fff',
          background: '#101014',
          borderRadius: 2,
          boxShadow: '0 2px 12px #0004',
          '& .MuiDataGrid-cell': {
            color: '#fff',
            background: '#191927',
            borderBottom: '1px solid #232336',
          },
          '& .MuiDataGrid-columnHeaders': {
            background: '#232336',
            color: '#fbbf24',
            fontWeight: 700,
            borderBottom: '2px solid #fbbf24',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            color: '#fbbf24',
            fontWeight: 700,
          },
          '& .MuiDataGrid-row': {
            transition: 'background 0.2s',
            '&:hover': {
              backgroundColor: '#37376b',
              color: '#fff',
            },
          },
          '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#1a1a2e' },
          '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#191927' },
          '& .MuiDataGrid-footerContainer': { background: '#232336', color: '#fff' },
          '& .MuiSvgIcon-root, & .MuiButtonBase-root': {
            color: '#fff !important',
            opacity: 1,
          },
          '& .MuiDataGrid-iconButtonContainer': {
            color: '#fff',
          },
          '& .MuiDataGrid-actionsCell': {
            color: '#fff',
          },
        }}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
      {deleteDialog.open && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#232336', padding: 24, borderRadius: 8, color: '#fff', minWidth: 320 }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Delete User</h2>
            <p>Are you sure you want to permanently delete this user? This action cannot be undone.</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteDialog({ open: false, userId: null })} style={{ padding: '8px 18px', borderRadius: 6, background: '#a78bfa', color: '#232336', fontWeight: 600, border: 'none' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteDialog.userId!)} style={{ padding: '8px 18px', borderRadius: 6, background: '#ef4444', color: '#fff', fontWeight: 600, border: 'none' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}
