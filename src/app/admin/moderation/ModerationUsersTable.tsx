"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress, Typography } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';

import { useUsers } from './useUsers';

export default function ModerationUsersTable() {
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const { users, isLoading, error, mutate } = useUsers();
  const { enqueueSnackbar } = useSnackbar();
  const [banLoading, setBanLoading] = React.useState<string | null>(null);
  const [promoteLoading, setPromoteLoading] = React.useState<string | null>(null);

  async function handleBan(row: any) {
    setBanLoading(row.id);
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
      enqueueSnackbar('User banned', { variant: 'success' });
      mutate();
    } catch {
      enqueueSnackbar('Error banning user', { variant: 'error' });
    }
    setBanLoading(null);
  }
  async function handleWarn(row: any) {
    await fetch('/api/admin/auditlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'WARN_USER', targetId: row.id, targetType: 'User', details: row.email }),
    });
    enqueueSnackbar('User warned (logged only)', { variant: 'info' });
  }
  async function handlePromote(row: any) {
    setPromoteLoading(row.id);
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
      enqueueSnackbar('User promoted to admin', { variant: 'success' });
      mutate();
    } catch {
      enqueueSnackbar('Error promoting user', { variant: 'error' });
    }
    setPromoteLoading(null);
  }
  const columns: GridColDef[] = [
    { field: 'email', headerName: 'Email', flex: 2 },
    { field: 'role', headerName: 'Role', width: 110 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 240,
      getActions: (params: any) => {
        const actions = [
          <GridActionsCellItem 
            key="ban"
            icon={banLoading === params.row.id ? <CircularProgress size={20} color="error" /> : <BlockIcon color="error" />} 
            label="Ban" 
            onClick={() => handleBan(params.row)} 
            disabled={!!banLoading}
          />,
          <GridActionsCellItem 
            key="warn"
            icon={<WarningIcon color="warning" />} 
            label="Warn" 
            onClick={() => handleWarn(params.row)} 
          />,
        ];
        if (params.row.role !== 'ADMIN') {
          actions.push(
            <GridActionsCellItem
              key="promote"
              icon={promoteLoading === params.row.id ? <CircularProgress size={20} color="info" /> : <span style={{ fontWeight: 700, color: '#38bdf8' }}>A</span>}
              label="Promote to Admin"
              onClick={() => handlePromote(params.row)}
              showInMenu
              disabled={!!promoteLoading}
            />
          );
        }
        actions.push(
          <GridActionsCellItem 
            key="delete"
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
      enqueueSnackbar('User deleted', { variant: 'success' });
      mutate();
    } catch {
      enqueueSnackbar('Error deleting user', { variant: 'error' });
    }
    setDeleteDialog({ open: false, userId: null });
  }

  return (
    <Box sx={{ minHeight: 400, width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, mb: 3 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>Failed to load users. Please try again.</Typography>
      )}
      {isLoading ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={200}>
          <CircularProgress color="info" />
        </Box>
      ) : users.length === 0 ? (
        <Typography sx={{ color: '#a78bfa', textAlign: 'center', py: 4 }}>No users to moderate 🎉</Typography>
      ) : (
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
      )}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, userId: null })}>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444', background: '#232336' }}>Delete User</DialogTitle>
        <DialogContent sx={{ background: '#232336' }}>
          <DialogContentText sx={{ color: '#fff' }}>
            Are you sure you want to permanently delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ background: '#232336' }}>
          <Button onClick={() => setDeleteDialog({ open: false, userId: null })} sx={{ color: '#a78bfa', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteDialog.userId!)} sx={{ color: '#fff', background: '#ef4444', fontWeight: 600, '&:hover': { background: '#dc2626' } }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
