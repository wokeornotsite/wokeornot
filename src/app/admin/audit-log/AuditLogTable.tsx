"use client";
import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, MenuItem, Select, InputLabel, FormControl, Alert, Chip, Button } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import { useAuditLog } from './useAuditLog';
import { useRouter, useSearchParams } from 'next/navigation';
import DownloadIcon from '@mui/icons-material/Download';

const ACTION_LABELS: Record<string, string> = {
  BAN_USER: 'Banned User',
  UNBAN_USER: 'Unbanned User',
  WARN_USER: 'Warned User',
  DELETE_USER: 'Deleted User',
  PROMOTE_ADMIN: 'Promoted to Admin',
  PROMOTE_MODERATOR: 'Promoted to Moderator',
  DEMOTE_USER: 'Demoted to User',
  DELETE_REVIEW: 'Deleted Review',
  HIDE_REVIEW: 'Hid Review',
  UNHIDE_REVIEW: 'Unhid Review',
  DELETE_MOVIE: 'Deleted Content',
  BULK_DELETE_CONTENT: 'Bulk Deleted Content',
  DELETE_FORUM_THREAD: 'Deleted Forum Thread',
};

// Color per action (red = destructive, green = restorative, amber = warn, blue = role change)
const ACTION_COLORS: Record<string, string> = {
  BAN_USER: '#ef4444',
  DELETE_USER: '#ef4444',
  DELETE_REVIEW: '#ef4444',
  DELETE_MOVIE: '#ef4444',
  BULK_DELETE_CONTENT: '#ef4444',
  DELETE_FORUM_THREAD: '#ef4444',
  HIDE_REVIEW: '#f97316',
  WARN_USER: '#fbbf24',
  UNBAN_USER: '#22c55e',
  UNHIDE_REVIEW: '#22c55e',
  PROMOTE_ADMIN: '#38bdf8',
  PROMOTE_MODERATOR: '#a78bfa',
  DEMOTE_USER: '#9ca3af',
};

const TARGET_TYPE_COLORS: Record<string, string> = {
  User: '#38bdf8',
  Review: '#a78bfa',
  Movie: '#e879f9',
  ForumThread: '#fbbf24',
};

const ACTION_OPTIONS = Object.keys(ACTION_LABELS);
const TARGET_TYPE_OPTIONS = ['User', 'Review', 'Movie', 'ForumThread'];

export default function AuditLogTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 25 });
  const [action, setAction] = React.useState('');
  const [targetType, setTargetType] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
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
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  function exportCSV() {
    const header = ['Timestamp', 'Admin', 'Action', 'Type', 'Details', 'TargetID'];
    const csvRows = rows.map((r: any) => [
      r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
      r.admin?.email || '',
      r.action || '',
      r.targetType || '',
      r.details || '',
      r.targetId || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csvContent = [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const columns: GridColDef[] = [
    {
      field: 'createdAt',
      headerName: 'Timestamp',
      width: 175,
      valueFormatter: (value: any) => value ? new Date(value).toLocaleString() : '—',
    },
    {
      field: 'admin',
      headerName: 'Admin',
      flex: 1,
      valueGetter: (_value: any, row: any) => row?.admin?.email || '—',
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 195,
      renderCell: (params: any) => {
        const label = ACTION_LABELS[params.value] || params.value || '—';
        const color = ACTION_COLORS[params.value] || '#9ca3af';
        return (
          <Chip
            label={label}
            size="small"
            sx={{ background: `${color}22`, color, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${color}44` }}
          />
        );
      },
    },
    {
      field: 'targetType',
      headerName: 'Type',
      width: 110,
      renderCell: (params: any) => {
        const color = TARGET_TYPE_COLORS[params.value] || '#9ca3af';
        return params.value
          ? <Chip label={params.value} size="small" sx={{ background: `${color}18`, color, fontWeight: 600, fontSize: '0.7rem' }} />
          : <span style={{ color: '#9ca3af' }}>—</span>;
      },
    },
    {
      field: 'details',
      headerName: 'Details',
      flex: 2,
      valueFormatter: (value: any) => value || '—',
    },
    {
      field: 'targetId',
      headerName: 'Target ID',
      width: 130,
      valueFormatter: (value: any) => value ? `${String(value).slice(0, 10)}…` : '—',
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, mb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load audit log. Please try again.
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
        <FormControl size="small" sx={{ minWidth: 160 }}>
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
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          style={{ background: '#232336', color: '#fff', border: '1px solid #37376b', borderRadius: 6, padding: '6px 10px', fontSize: 14, colorScheme: 'dark' }}
          title="Start date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          style={{ background: '#232336', color: '#fff', border: '1px solid #37376b', borderRadius: 6, padding: '6px 10px', fontSize: 14, colorScheme: 'dark' }}
          title="End date"
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={exportCSV}
          sx={{ color: '#38bdf8', borderColor: '#38bdf8', textTransform: 'none', ml: 'auto' }}
        >
          Export CSV
        </Button>
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
          '& .MuiDataGrid-cell': { color: '#fff', background: '#191927', borderBottom: '1px solid #232336' },
          '& .MuiDataGrid-columnHeaders': { background: '#232336', color: '#fbbf24', fontWeight: 700, borderBottom: '2px solid #fbbf24' },
          '& .MuiDataGrid-columnHeaderTitle': { color: '#fbbf24', fontWeight: 700 },
          '& .MuiDataGrid-row': { transition: 'background 0.2s', '&:hover': { backgroundColor: '#37376b', color: '#fff' } },
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
