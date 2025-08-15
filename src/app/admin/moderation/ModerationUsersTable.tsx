"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem, GridSortModel } from '@mui/x-data-grid';
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, Alert } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';

import { useUsers } from './useUsers';
import Snackbar from '@mui/material/Snackbar';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ModerationUsersTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [q, setQ] = React.useState('');
  const [role, setRole] = React.useState<string>('');
  const dq = useDebouncedValue(q, 300);

  // Initialize from URL
  React.useEffect(() => {
    const qp = new URLSearchParams(searchParams as any);
    const page = parseInt(qp.get('page') || '0', 10);
    const pageSize = parseInt(qp.get('pageSize') || '10', 10);
    const q0 = qp.get('q') || '';
    const role0 = qp.get('role') || '';
    const sortBy0 = qp.get('sortBy');
    const sortOrder0 = (qp.get('sortOrder') as 'asc' | 'desc') || undefined;
    setPaginationModel({ page: isNaN(page) ? 0 : page, pageSize: isNaN(pageSize) ? 10 : pageSize });
    setQ(q0);
    setRole(role0);
    if (sortBy0 && sortOrder0) setSortModel([{ field: sortBy0, sort: sortOrder0 } as any]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to URL
  React.useEffect(() => {
    const qp = new URLSearchParams();
    if (paginationModel.page) qp.set('page', String(paginationModel.page));
    if (paginationModel.pageSize !== 10) qp.set('pageSize', String(paginationModel.pageSize));
    if (dq) qp.set('q', dq);
    if (role) qp.set('role', role);
    const sf = sortModel[0]?.field;
    const sd = sortModel[0]?.sort;
    if (sf && sd) { qp.set('sortBy', String(sf)); qp.set('sortOrder', String(sd)); }
    const query = qp.toString();
    router.replace(`?${query}`);
  }, [dq, role, paginationModel.page, paginationModel.pageSize, sortModel, router]);

  const sortField = sortModel[0]?.field;
  const sortDir = (sortModel[0]?.sort || 'desc') as 'asc' | 'desc';
  const sortBy: 'email' | 'createdAt' | 'role' =
    sortField === 'email' || sortField === 'role' ? (sortField as any) : 'createdAt';

  const { rows, total, isLoading, error, mutate } = useUsers({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    sortBy,
    sortOrder: sortDir,
    q: dq || undefined,
    role: role || undefined,
  });
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });

  async function handleBan(row: any) {
    try {
      const reason = window.prompt('Ban reason (optional)?') || undefined;
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isBanned: true, banReason: reason }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BAN_USER', targetId: row.id, targetType: 'User', details: `${row.email} | ${reason || ''}` }),
      });
      setSnackbar({ open: true, message: 'User banned' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error banning user' });
    }
  }
  async function handleUnban(row: any) {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isBanned: false, banReason: null }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UNBAN_USER', targetId: row.id, targetType: 'User', details: row.email }),
      });
      setSnackbar({ open: true, message: 'User unbanned' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error unbanning user' });
    }
  }
  async function handleWarn(row: any) {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, warnDelta: 1 }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'WARN_USER', targetId: row.id, targetType: 'User', details: row.email }),
      });
      setSnackbar({ open: true, message: 'Warning recorded' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error warning user' });
    }
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
    { field: 'warnCount', headerName: 'Warnings', width: 120 },
    { field: 'isBanned', headerName: 'Banned', width: 110, type: 'boolean' },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 240,
      getActions: (params) => {
        const actions = [
          params.row.isBanned
            ? <GridActionsCellItem icon={<BlockIcon color="success" />} label="Unban" onClick={() => handleUnban(params.row)} />
            : <GridActionsCellItem icon={<BlockIcon color="error" />} label="Ban" onClick={() => handleBan(params.row)} />,
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

  const NoRows = React.useCallback(() => (
    <Box sx={{ p: 2, color: '#9ca3af' }}>No users found</Box>
  ), []);

  return (
    <Box sx={{ height: 660, width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, mb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load users. Please try again.
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          placeholder="Search email..."
          InputProps={{ sx: { color: '#fff' } }}
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="role-label" sx={{ color: '#fff' }}>Role</InputLabel>
          <Select
            labelId="role-label"
            label="Role"
            value={role}
            onChange={(e) => { setRole(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
            sx={{ color: '#fff' }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="USER">USER</MenuItem>
            <MenuItem value="ADMIN">ADMIN</MenuItem>
            <MenuItem value="MODERATOR">MODERATOR</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={total}
        paginationMode="server"
        sortingMode="server"
        slots={{ noRowsOverlay: NoRows }}
        loading={isLoading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        onSortModelChange={(model) => setSortModel(model)}
        pageSizeOptions={[10, 20, 50]}
        autoHeight={false}
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
