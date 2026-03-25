"use client";
import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, MenuItem, Select, InputLabel, FormControl, Alert } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import { useAuditLog } from './useAuditLog';
import { useRouter, useSearchParams } from 'next/navigation';

const ACTION_LABELS: Record<string, string> = {
  BAN_USER: 'Banned User',
  UNBAN_USER: 'Unbanned User',
  WARN_USER: 'Warned User',
  DELETE_USER: 'Deleted User',
  PROMOTE_ADMIN: 'Promoted to Admin',
  DELETE_REVIEW: 'Deleted Review',
  HIDE_REVIEW: 'Hid Review',
  UNHIDE_REVIEW: 'Unhid Review',
  DELETE_MOVIE: 'Deleted Content',
  DELETE_FORUM_THREAD: 'Deleted Forum Thread',
};

const ACTION_OPTIONS = Object.keys(ACTION_LABELS);
const TARGET_TYPE_OPTIONS = ['User', 'Review', 'Movie', 'ForumThread'];

export default function AuditLogTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 25 });
  const [action, setAction] = React.useState('');
  const [targetType, setTargetType] = React.useState('');
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Initialize from URL
  React.useEffect(() => {
    const qp = new URLSearchParams(searchParams as any);
    const page = parseInt(qp.get('page') || '0', 10);
    const pageSize = parseInt(qp.get('pageSize') || '25', 10);
    setPaginationModel({ page: isNaN(page) ? 0 : page, pageSize: isNaN(pageSize) ? 25 : pageSize });
    setAction(qp.get('action') || '');
    setTargetType(qp.get('targetType') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to URL
  React.useEffect(() => {
    const qp = new URLSearchParams();
    if (paginationModel.page) qp.set('page', String(paginationModel.page));
    if (paginationModel.pageSize !== 25) qp.set('pageSize', String(paginationModel.pageSize));
    if (action) qp.set('action', action);
    if (targetType) qp.set('targetType', targetType);
    router.replace(`?${qp.toString()}`);
  }, [action, targetType, paginationModel.page, paginationModel.pageSize, router]);

  const { rows, total, isLoading, error } = useAuditLog({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    action: action || undefined,
    targetType: targetType || undefined,
  });

  const columns: GridColDef[] = [
    {
      field: 'createdAt',
      headerName: 'Timestamp',
      width: 180,
      valueFormatter: (params: any) =>
        params.value ? new Date(params.value).toLocaleString() : '—',
    },
    {
      field: 'admin',
      headerName: 'Admin',
      flex: 1,
      valueGetter: (params: any) => params?.row?.admin?.email || '—',
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 180,
      valueFormatter: (params: any) => ACTION_LABELS[params.value] || params.value || '—',
    },
    {
      field: 'targetType',
      headerName: 'Target Type',
      width: 130,
    },
    {
      field: 'targetId',
      headerName: 'Target ID',
      width: 150,
      valueFormatter: (params: any) =>
        params.value ? `${String(params.value).slice(0, 12)}…` : '—',
    },
    {
      field: 'details',
      headerName: 'Details',
      flex: 2,
      valueFormatter: (params: any) => params.value || '—',
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, mb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load audit log. Please try again.
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="action-label" sx={{ color: '#fff' }}>Action</InputLabel>
          <Select
            labelId="action-label"
            label="Action"
            value={action}
            onChange={(e) => { setAction(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
            sx={{ color: '#fff' }}
          >
            <MenuItem value="">All Actions</MenuItem>
            {ACTION_OPTIONS.map(a => (
              <MenuItem key={a} value={a}>{ACTION_LABELS[a]}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="target-type-label" sx={{ color: '#fff' }}>Target Type</InputLabel>
          <Select
            labelId="target-type-label"
            label="Target Type"
            value={targetType}
            onChange={(e) => { setTargetType(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
            sx={{ color: '#fff' }}
          >
            <MenuItem value="">All Types</MenuItem>
            {TARGET_TYPE_OPTIONS.map(t => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={total}
        paginationMode="server"
        loading={isLoading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        autoHeight={false}
        disableRowSelectionOnClick
        slots={{ noRowsOverlay: () => <Box sx={{ p: 2, color: '#9ca3af' }}>No audit log entries found</Box> }}
        sx={{
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
          fontSize: 15,
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
            '&:hover': { backgroundColor: '#37376b', color: '#fff' },
          },
          '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#1a1a2e' },
          '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#191927' },
          '& .MuiDataGrid-footerContainer': { background: '#232336', color: '#fff' },
          '& .MuiSvgIcon-root, & .MuiButtonBase-root': { color: '#fff !important', opacity: 1 },
          '& .MuiDataGrid-iconButtonContainer': { color: '#fff' },
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
