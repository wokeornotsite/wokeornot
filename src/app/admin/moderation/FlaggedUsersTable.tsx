'use client';
import React from 'react';
import useSWR from 'swr';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box, Chip, Tooltip, CircularProgress, IconButton, Snackbar } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import UserActivityDialog from './UserActivityDialog';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function FlaggedUsersTable() {
  const { data, isLoading, mutate } = useSWR('/api/admin/users?flagged=true&pageSize=50', fetcher);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [activityDialog, setActivityDialog] = React.useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });

  const rows: any[] = data?.data ?? [];

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

  async function handleRemoveWarning(row: any) {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, warnDelta: -1 }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REMOVE_WARNING', targetId: row.id, targetType: 'User', details: row.email }),
      });
      setSnackbar({ open: true, message: 'Warning removed' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error removing warning' });
    }
  }

  const columns: GridColDef[] = [
    { field: 'email', headerName: 'Email', flex: 2, minWidth: 200 },
    {
      field: 'warnCount',
      headerName: 'Warn Count',
      width: 120,
      renderCell: (params: any) => {
        const count = params.value ?? 0;
        if (count >= 3) return <Chip label={count} size="small" sx={{ background: '#ef444422', color: '#ef4444', fontWeight: 700 }} />;
        if (count === 2) return <Chip label={count} size="small" sx={{ background: '#fbbf2422', color: '#fbbf24', fontWeight: 700 }} />;
        if (count > 0) return <Chip label={count} size="small" sx={{ background: '#9ca3af22', color: '#9ca3af', fontWeight: 700 }} />;
        return <span style={{ color: '#9ca3af' }}>0</span>;
      },
    },
    {
      field: 'isBanned',
      headerName: 'Status',
      width: 120,
      renderCell: (params: any) => {
        if (params.row.isBanned) {
          return (
            <Tooltip title={params.row.banReason || 'No reason given'} arrow>
              <Chip label="Banned" color="error" size="small" />
            </Tooltip>
          );
        }
        return <Chip label="Active" color="success" size="small" />;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 110,
      valueFormatter: (value: any) => value ? new Date(value).toLocaleDateString() : '—',
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 130,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            key="view"
            icon={<InfoIcon sx={{ color: '#38bdf8' }} />}
            label="View Activity"
            onClick={() => setActivityDialog({ open: true, userId: params.row.id })}
          />,
        ];
        if (params.row.isBanned) {
          actions.push(
            <GridActionsCellItem
              key="unban"
              icon={<BlockIcon color="success" />}
              label="Unban"
              onClick={() => handleUnban(params.row)}
            />
          );
        }
        if (params.row.warnCount > 0) {
          actions.push(
            <GridActionsCellItem
              key="remove-warn"
              icon={<RemoveCircleOutlineIcon sx={{ color: '#22c55e' }} />}
              label="Remove Warning"
              onClick={() => handleRemoveWarning(params.row)}
              showInMenu
            />
          );
        }
        return actions;
      },
    },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
        <CircularProgress sx={{ color: '#fbbf24' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Tooltip title="Refresh" arrow>
          <IconButton onClick={() => mutate()} sx={{ color: '#9ca3af', '&:hover': { color: '#fbbf24' } }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        disableRowSelectionOnClick
        hideFooter={rows.length <= 50}
        slots={{
          noRowsOverlay: () => (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#22c55e', fontWeight: 600, py: 4 }}>
              No flagged users — all clear! ✓
            </Box>
          ),
        }}
        sx={{
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
          fontSize: 15,
          color: '#fff',
          background: '#101014',
          borderRadius: 2,
          boxShadow: '0 2px 12px #0004',
          '& .MuiDataGrid-cell': { color: '#fff', background: '#191927', borderBottom: '1px solid #232336' },
          '& .MuiDataGrid-columnHeaders': { background: '#232336', color: '#fbbf24', fontWeight: 700, borderBottom: '2px solid #fbbf24' },
          '& .MuiDataGrid-columnHeaderTitle': { color: '#fbbf24', fontWeight: 700 },
          '& .MuiDataGrid-row': { transition: 'background 0.2s', '&:hover': { backgroundColor: '#37376b', color: '#fff' } },
          '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#1a1a2e' },
          '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#191927' },
          '& .MuiDataGrid-footerContainer': { background: '#232336', color: '#fff' },
          '& .MuiSvgIcon-root, & .MuiButtonBase-root': { color: '#fff !important', opacity: 1 },
          '& .MuiDataGrid-iconButtonContainer': { color: '#fff' },
          '& .MuiDataGrid-actionsCell': { color: '#fff' },
        }}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
      <UserActivityDialog
        open={activityDialog.open}
        userId={activityDialog.userId}
        onClose={() => setActivityDialog({ open: false, userId: null })}
      />
    </Box>
  );
}
