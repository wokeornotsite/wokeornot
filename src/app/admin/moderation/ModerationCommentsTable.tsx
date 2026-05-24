"use client";
import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowSelectionModel,
  GridRowId,
} from '@mui/x-data-grid';
import {
  Box, TextField, MenuItem, Select, InputLabel, FormControl, Alert,
  Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, ToggleButtonGroup, ToggleButton, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RestoreIcon from '@mui/icons-material/Restore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import Snackbar from '@mui/material/Snackbar';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useComments } from './useComments';

const DATAGRID_SX = {
  fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
  fontSize: 14,
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
  '& .MuiDataGrid-checkboxInput': { color: '#a78bfa !important' },
};

const emptySelection = (): GridRowSelectionModel => ({ type: 'include', ids: new Set<GridRowId>() });

export default function ModerationCommentsTable() {
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 20 });
  const [q, setQ] = React.useState('');
  const [contentType, setContentType] = React.useState('');
  const [deleted, setDeleted] = React.useState<'false' | 'true' | 'all'>('false');
  const [selectedIds, setSelectedIds] = React.useState<GridRowSelectionModel>(emptySelection);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '' });
  const [hardDeleteDialog, setHardDeleteDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [bulkHardDeleteDialog, setBulkHardDeleteDialog] = React.useState(false);
  const dq = useDebouncedValue(q, 300);

  const { rows, total, isLoading, error, mutate } = useComments({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    q: dq || undefined,
    contentType: contentType || undefined,
    deleted,
  });

  async function handleSoftDelete(id: string, currentIsDeleted: boolean) {
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDeleted: !currentIsDeleted }),
      });
      if (!res.ok) throw new Error('Request failed');
      setSnackbar({ open: true, message: currentIsDeleted ? 'Comment restored' : 'Comment soft-deleted' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error updating comment' });
    }
  }

  async function handleHardDelete(id: string) {
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Request failed');
      setSnackbar({ open: true, message: 'Comment permanently deleted' });
      setSelectedIds(prev => {
        if (!prev.ids.has(id)) return prev;
        const next = new Set(prev.ids);
        next.delete(id);
        return { ...prev, ids: next };
      });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting comment' });
    }
    setHardDeleteDialog({ open: false, id: null });
  }

  async function handleBulkSoftDelete() {
    const ids = Array.from(selectedIds.ids) as string[];
    try {
      await Promise.all(
        ids.map(id =>
          fetch('/api/admin/comments', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isDeleted: true }),
          })
        )
      );
      setSnackbar({ open: true, message: `Soft-deleted ${ids.length} comment(s)` });
      setSelectedIds(emptySelection());
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error soft-deleting comments' });
    }
  }

  async function handleBulkHardDelete() {
    const ids = Array.from(selectedIds.ids) as string[];
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok) {
        setSnackbar({ open: true, message: `Permanently deleted ${data.deleted} comment(s)` });
        setSelectedIds(emptySelection());
        mutate();
      } else {
        setSnackbar({ open: true, message: data.error || 'Error deleting comments' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Error deleting comments' });
    }
    setBulkHardDeleteDialog(false);
  }

  const typeColor: Record<string, string> = { MOVIE: '#e879f9', TV_SHOW: '#38bdf8', KIDS: '#a78bfa' };

  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: 'Author',
      flex: 0.9,
      minWidth: 130,
      valueGetter: (_v: any, row: any) => row?.user?.email || '',
      renderCell: (params: any) => (
        <span style={{ color: '#a78bfa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%' }}>
          {params.row?.user?.email || '—'}
        </span>
      ),
    },
    {
      field: 'text',
      headerName: 'Comment',
      flex: 2.0,
      minWidth: 200,
      renderCell: (params: any) => (
        <Tooltip title={params.value || ''} arrow placement="top">
          <span style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: 'block', width: '100%',
            color: params.row?.isDeleted ? '#6b7280' : '#e2e8f0',
            textDecoration: params.row?.isDeleted ? 'line-through' : 'none',
            fontStyle: params.row?.isDeleted ? 'italic' : 'normal',
          }}>
            {params.value || '—'}
          </span>
        </Tooltip>
      ),
    },
    {
      field: 'content',
      headerName: 'Content',
      flex: 1.1,
      minWidth: 140,
      valueGetter: (_v: any, row: any) => row?.content?.title || '',
      renderCell: (params: any) => {
        const title = params.row?.content?.title;
        const type = params.row?.content?.contentType;
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', overflow: 'hidden' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>{title || '—'}</span>
            {type && (
              <span style={{ fontSize: 10, fontWeight: 700, color: typeColor[type] || '#9ca3af', background: `${typeColor[type] || '#9ca3af'}18`, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
                {type}
              </span>
            )}
          </span>
        );
      },
    },
    {
      field: 'parentId',
      headerName: 'Type',
      width: 85,
      renderCell: (params: any) => (
        <Chip
          label={params.row?.parentId ? 'Reply' : 'Comment'}
          size="small"
          icon={<ChatBubbleOutlineIcon style={{ fontSize: 12 }} />}
          sx={{
            fontSize: 11,
            background: params.row?.parentId ? '#1c1c2e' : '#1e2a1e',
            color: params.row?.parentId ? '#9ca3af' : '#4ade80',
            border: params.row?.parentId ? '1px solid #374151' : '1px solid #16a34a',
          }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 82,
      renderCell: (params: any) => {
        const val = params.row?.createdAt;
        if (!val) return <span style={{ color: '#4b5563' }}>—</span>;
        const d = new Date(val);
        const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
        if (daysAgo === 0) return <span style={{ color: '#4ade80', fontSize: 12 }}>Today</span>;
        if (daysAgo === 1) return <span style={{ color: '#86efac', fontSize: 12 }}>Yesterday</span>;
        if (daysAgo < 7) return <span style={{ fontSize: 12, color: '#94a3b8' }}>{daysAgo}d ago</span>;
        const isThisYear = d.getFullYear() === new Date().getFullYear();
        return <span style={{ color: '#94a3b8', fontSize: 12 }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(isThisYear ? {} : { year: '2-digit' }) })}</span>;
      },
    },
    {
      field: 'isDeleted',
      headerName: 'Status',
      width: 85,
      renderCell: (params: any) =>
        params.row.isDeleted
          ? <Chip label="Deleted" size="small" sx={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', fontWeight: 700 }} />
          : <Chip label="Live" color="success" size="small" />,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 90,
      getActions: (params: import('@mui/x-data-grid').GridRowParams) => [
        params.row.isDeleted
          ? <GridActionsCellItem key="restore" icon={<RestoreIcon sx={{ color: '#4ade80' }} />} label="Restore" onClick={() => handleSoftDelete(params.row.id, true)} showInMenu={false} />
          : <GridActionsCellItem key="softdel" icon={<DeleteIcon color="warning" />} label="Soft-delete" onClick={() => handleSoftDelete(params.row.id, false)} showInMenu={false} />,
        <GridActionsCellItem key="harddel" icon={<DeleteForeverIcon color="error" />} label="Hard-delete" onClick={() => setHardDeleteDialog({ open: true, id: params.row.id })} showInMenu={false} />,
      ],
    },
  ];

  const selectedCount = selectedIds.ids.size;

  return (
    <Box sx={{ width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, mb: 3, color: '#f3f4f6' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load comments. Please try again.</Alert>}

      {/* Filters row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          placeholder="Search text, author, content..."
          InputProps={{ sx: { color: '#fff' } }}
          sx={{ minWidth: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ color: '#9ca3af' }}>Content Type</InputLabel>
          <Select
            label="Content Type"
            value={contentType}
            onChange={(e) => { setContentType(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
            sx={{ color: '#fff' }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="MOVIE">MOVIE</MenuItem>
            <MenuItem value="TV_SHOW">TV_SHOW</MenuItem>
            <MenuItem value="KIDS">KIDS</MenuItem>
          </Select>
        </FormControl>
        <ToggleButtonGroup
          value={deleted}
          exclusive
          size="small"
          onChange={(_, v) => { if (v) { setDeleted(v); setPaginationModel(p => ({ ...p, page: 0 })); } }}
          sx={{ '& .MuiToggleButton-root': { color: '#9ca3af', borderColor: '#374151', fontSize: 12 }, '& .Mui-selected': { color: '#fbbf24 !important', background: '#37376b !important' } }}
        >
          <ToggleButton value="false">Live</ToggleButton>
          <ToggleButton value="true">Deleted</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>

        {selectedCount > 0 && (
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<DeleteIcon />}
              onClick={handleBulkSoftDelete}
              sx={{ borderColor: '#fbbf24', color: '#fbbf24' }}
            >
              Soft-delete {selectedCount}
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setBulkHardDeleteDialog(true)}
            >
              Hard-delete {selectedCount}
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ height: 540 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={total}
          paginationMode="server"
          loading={isLoading}
          checkboxSelection
          rowSelectionModel={selectedIds}
          onRowSelectionModelChange={(model) => setSelectedIds(model)}
          slots={{ noRowsOverlay: () => <Box sx={{ p: 2, color: '#9ca3af', fontSize: 13 }}>No comments found</Box> }}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[20, 50, 100]}
          autoHeight={false}
          disableRowSelectionOnClick
          sx={DATAGRID_SX}
        />
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })} message={snackbar.message} />

      {/* Hard-delete single confirmation */}
      <Dialog open={hardDeleteDialog.open} onClose={() => setHardDeleteDialog({ open: false, id: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Hard-delete Comment</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            This will <strong style={{ color: '#fca5a5' }}>permanently delete</strong> the comment from the database. This cannot be undone.
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Use soft-delete if you want to hide it while keeping a record.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHardDeleteDialog({ open: false, id: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={() => handleHardDelete(hardDeleteDialog.id!)} variant="contained" color="error" startIcon={<DeleteForeverIcon />}>Delete Permanently</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk hard-delete confirmation */}
      <Dialog open={bulkHardDeleteDialog} onClose={() => setBulkHardDeleteDialog(false)} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>Hard-delete {selectedCount} Comments</DialogTitle>
        <DialogContent>
          <Typography>
            This will <strong style={{ color: '#fca5a5' }}>permanently delete {selectedCount} comment(s)</strong> from the database. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkHardDeleteDialog(false)} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={handleBulkHardDelete} variant="contained" color="error" startIcon={<DeleteForeverIcon />}>Delete {selectedCount} Permanently</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
