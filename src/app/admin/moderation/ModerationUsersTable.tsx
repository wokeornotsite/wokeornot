"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem, GridSortModel, GridRowSelectionModel, GridRowId } from '@mui/x-data-grid';
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, Alert, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { useUsers } from './useUsers';
import Snackbar from '@mui/material/Snackbar';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useRouter, useSearchParams } from 'next/navigation';
import UserActivityDialog from './UserActivityDialog';
import { WARN_TEMPLATES, BAN_TEMPLATES } from '@/lib/moderation-templates';

export default function ModerationUsersTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; userId: string | null; email?: string }>({ open: false, userId: null });
  const [bulkBanDialog, setBulkBanDialog] = React.useState(false);
  const [bulkWarnDialog, setBulkWarnDialog] = React.useState(false);
  const [banDialog, setBanDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [banReason, setBanReason] = React.useState('');
  const [promoteDialog, setPromoteDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [moderatorDialog, setModeratorDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [demoteDialog, setDemoteDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [q, setQ] = React.useState('');
  const [role, setRole] = React.useState<string>('');
  const emptySelection = (): GridRowSelectionModel => ({ type: 'include', ids: new Set<GridRowId>() });
  const [selectedIds, setSelectedIds] = React.useState<GridRowSelectionModel>(emptySelection);
  const [activityDialog, setActivityDialog] = React.useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [warnDialog, setWarnDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [warnReason, setWarnReason] = React.useState('');
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

  async function confirmBan() {
    const row = banDialog.row;
    if (!row) return;
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isBanned: true, banReason: banReason || undefined }),
      });
      setSnackbar({ open: true, message: 'User banned' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error banning user' });
    }
    setBanDialog({ open: false, row: null });
    setBanReason('');
  }

  async function handleUnban(row: any) {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isBanned: false, banReason: null }),
      });
      setSnackbar({ open: true, message: 'User unbanned' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error unbanning user' });
    }
  }

  async function confirmWarn() {
    const row = warnDialog.row;
    if (!row) return;
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, warnDelta: 1, warnReason: warnReason || undefined }),
      });
      setSnackbar({ open: true, message: 'Warning issued' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error warning user' });
    }
    setWarnDialog({ open: false, row: null });
    setWarnReason('');
  }

  async function handleRemoveWarning(row: any) {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, warnDelta: -1 }),
      });
      setSnackbar({ open: true, message: 'Warning removed' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error removing warning' });
    }
  }

  async function confirmModerator() {
    const row = moderatorDialog.row;
    if (!row) return;
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, role: 'MODERATOR' }),
      });
      setSnackbar({ open: true, message: 'User promoted to moderator' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error promoting user to moderator' });
    }
    setModeratorDialog({ open: false, row: null });
  }

  async function confirmDemote() {
    const row = demoteDialog.row;
    if (!row) return;
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, role: 'USER' }),
      });
      setSnackbar({ open: true, message: 'User demoted to User role' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error demoting user' });
    }
    setDemoteDialog({ open: false, row: null });
  }

  async function confirmPromote() {
    const row = promoteDialog.row;
    if (!row) return;
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, role: 'ADMIN' }),
      });
      setSnackbar({ open: true, message: 'User promoted to admin' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error promoting user' });
    }
    setPromoteDialog({ open: false, row: null });
  }

  const columns: GridColDef[] = [
    { field: 'email', headerName: 'Email', flex: 1.6, minWidth: 160,
      renderCell: (params: any) => <span style={{ color: '#a78bfa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%', fontSize: 12 }}>{params.value}</span>,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params: any) => <span style={{ color: '#e2e8f0', fontSize: 12 }}>{params.value || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>—</span>}</span>,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 110,
      renderCell: (params: any) => {
        const roleColor: Record<string, string> = { ADMIN: '#a855f7', MODERATOR: '#3b82f6', USER: '#6b7280' };
        const c = roleColor[params.value] || '#9ca3af';
        return <Chip label={params.value} size="small" sx={{ background: `${c}22`, color: c, fontWeight: 700, fontSize: '0.68rem', height: 20, border: `1px solid ${c}44`, '& .MuiChip-label': { px: '6px' } }} />;
      },
    },
    {
      field: 'warnCount',
      headerName: 'Warns',
      width: 72,
      renderCell: (params: any) => {
        const count = params.value ?? 0;
        if (count >= 3) return <Chip label={count} size="small" sx={{ background: '#ef444422', color: '#ef4444', fontWeight: 700, height: 20, '& .MuiChip-label': { px: '6px' } }} />;
        if (count === 2) return <Chip label={count} size="small" sx={{ background: '#fbbf2422', color: '#fbbf24', fontWeight: 700, height: 20, '& .MuiChip-label': { px: '6px' } }} />;
        return <span style={{ color: count > 0 ? '#fbbf24' : '#4b5563', fontSize: 12 }}>{count}</span>;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 90,
      renderCell: (params: any) => {
        if (!params.value) return <span style={{ color: '#4b5563' }}>—</span>;
        const d = new Date(params.value);
        const isThisYear = d.getFullYear() === new Date().getFullYear();
        return <span style={{ color: '#94a3b8', fontSize: 12 }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(isThisYear ? {} : { year: '2-digit' }) })}</span>;
      },
    },
    {
      field: 'isBanned',
      headerName: 'Status',
      width: 90,
      renderCell: (params: any) => {
        if (params.row.isBanned) {
          return (
            <Tooltip title={params.row.banReason || 'No reason given'} arrow>
              <Chip label="Banned" color="error" size="small" sx={{ fontSize: '0.68rem', height: 20, '& .MuiChip-label': { px: '6px' } }} />
            </Tooltip>
          );
        }
        return <Chip label="Active" color="success" size="small" sx={{ fontSize: '0.68rem', height: 20, '& .MuiChip-label': { px: '6px' } }} />;
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 120,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem icon={<InfoIcon sx={{ color: '#38bdf8' }} />} label="View Activity" onClick={() => setActivityDialog({ open: true, userId: params.row.id })} />,
          params.row.isBanned
            ? <GridActionsCellItem icon={<BlockIcon color="success" />} label="Unban" onClick={() => handleUnban(params.row)} />
            : <GridActionsCellItem icon={<BlockIcon color="error" />} label="Ban" onClick={() => { setBanReason(''); setBanDialog({ open: true, row: params.row }); }} />,
          <GridActionsCellItem icon={<WarningIcon color="warning" />} label="Warn" onClick={() => { setWarnReason(''); setWarnDialog({ open: true, row: params.row }); }} />,
        ];
        if (params.row.warnCount > 0) {
          actions.push(
            <GridActionsCellItem
              icon={<RemoveCircleOutlineIcon sx={{ color: '#22c55e' }} />}
              label="Remove Warning"
              onClick={() => handleRemoveWarning(params.row)}
              showInMenu
            />
          );
        }
        if (params.row.role !== 'ADMIN') {
          actions.push(
            <GridActionsCellItem
              icon={<span style={{ fontWeight: 700, color: '#38bdf8' }}>A</span>}
              label="Promote to Admin"
              onClick={() => setPromoteDialog({ open: true, row: params.row })}
              showInMenu
            />
          );
        }
        if (params.row.role === 'USER') {
          actions.push(
            <GridActionsCellItem
              icon={<span style={{ fontWeight: 700, color: '#a78bfa' }}>M</span>}
              label="Make Moderator"
              onClick={() => setModeratorDialog({ open: true, row: params.row })}
              showInMenu
            />
          );
        }
        if (params.row.role !== 'USER') {
          actions.push(
            <GridActionsCellItem
              icon={<span style={{ fontWeight: 700, color: '#f87171' }}>↓</span>}
              label="Demote to User"
              onClick={() => setDemoteDialog({ open: true, row: params.row })}
              showInMenu
            />
          );
        }
        actions.push(
          <GridActionsCellItem
            icon={<DeleteIcon color="error" />}
            label="Delete"
            onClick={() => setDeleteDialog({ open: true, userId: params.row.id, email: params.row.email })}
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
    <Box sx={{ height: 560, width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, mb: 3 }}>
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
          placeholder="Search email or name..."
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
        checkboxSelection
        onRowSelectionModelChange={(model) => setSelectedIds(model)}
        sx={{
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
          fontSize: 14,
          color: '#fff',
          background: '#101014',
          borderRadius: 2,
          boxShadow: '0 2px 12px #0004',
          '& .MuiDataGrid-cell': { color: '#fff', background: '#191927', borderBottom: '1px solid #232336' },
          '& .MuiDataGrid-columnHeaders': { background: '#232336', color: '#fbbf24', fontWeight: 700, borderBottom: '2px solid #fbbf24' },
          '& .MuiDataGrid-columnHeaderTitle': { color: '#fbbf24', fontWeight: 700 },
          '& .MuiDataGrid-row': { transition: 'background 0.15s', '&:hover': { backgroundColor: '#37376b', color: '#fff' } },
          '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#1a1a2e' },
          '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#191927' },
          '& .MuiDataGrid-footerContainer': { background: '#232336', color: '#fff' },
          '& .MuiSvgIcon-root, & .MuiButtonBase-root': { color: '#fff !important', opacity: 1 },
          '& .MuiDataGrid-iconButtonContainer': { color: '#fff' },
          '& .MuiDataGrid-actionsCell': { color: '#fff' },
          '& .MuiDataGrid-sortIcon': { color: '#fbbf24 !important' },
        }}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />

      {/* Ban dialog */}
      <Dialog open={banDialog.open} onClose={() => setBanDialog({ open: false, row: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 420 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Ban {banDialog.row?.email}</DialogTitle>
        <DialogContent>
          <FormControl size="small" fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel sx={{ color: '#9ca3af' }}>Template (optional)</InputLabel>
            <Select
              label="Template (optional)"
              value=""
              onChange={(e) => {
                const tmpl = BAN_TEMPLATES.find((t) => t.key === e.target.value);
                if (tmpl) setBanReason(tmpl.body);
              }}
              sx={{ color: '#fff' }}
            >
              {BAN_TEMPLATES.map((t) => (
                <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            autoFocus
            fullWidth
            size="small"
            multiline
            minRows={3}
            label="Reason (optional)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#9ca3af' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialog({ open: false, row: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmBan} variant="contained" color="error">Ban User</Button>
        </DialogActions>
      </Dialog>

      {/* Warn dialog */}
      <Dialog open={warnDialog.open} onClose={() => setWarnDialog({ open: false, row: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 420 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Warn {warnDialog.row?.email}</DialogTitle>
        <DialogContent>
          <FormControl size="small" fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel sx={{ color: '#9ca3af' }}>Template (optional)</InputLabel>
            <Select
              label="Template (optional)"
              value=""
              onChange={(e) => {
                const tmpl = WARN_TEMPLATES.find((t) => t.key === e.target.value);
                if (tmpl) setWarnReason(tmpl.body);
              }}
              sx={{ color: '#fff' }}
            >
              {WARN_TEMPLATES.map((t) => (
                <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            autoFocus
            fullWidth
            size="small"
            multiline
            minRows={3}
            label="Reason (optional)"
            value={warnReason}
            onChange={(e) => setWarnReason(e.target.value)}
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#9ca3af' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarnDialog({ open: false, row: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmWarn} variant="contained" sx={{ background: '#fbbf24', '&:hover': { background: '#d97706' }, color: '#000' }}>Issue Warning</Button>
        </DialogActions>
      </Dialog>

      {/* Promote to Admin dialog */}
      <Dialog open={promoteDialog.open} onClose={() => setPromoteDialog({ open: false, row: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Promote to Admin</DialogTitle>
        <DialogContent>
          <p>Promote <strong>{promoteDialog.row?.email}</strong> to Admin? They will have full access to this admin panel.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromoteDialog({ open: false, row: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmPromote} variant="contained" sx={{ background: '#38bdf8' }}>Promote</Button>
        </DialogActions>
      </Dialog>

      {/* Make Moderator dialog */}
      <Dialog open={moderatorDialog.open} onClose={() => setModeratorDialog({ open: false, row: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Make Moderator</DialogTitle>
        <DialogContent>
          <p>Promote <strong>{moderatorDialog.row?.email}</strong> to Moderator? They will be able to moderate reviews and content.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModeratorDialog({ open: false, row: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmModerator} variant="contained" sx={{ background: '#a78bfa' }}>Make Moderator</Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, userId: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>Delete User</DialogTitle>
        <DialogContent>
          {deleteDialog.email && (
            <p style={{ margin: '0 0 12px', color: '#fca5a5' }}>
              <strong>{deleteDialog.email}</strong>
            </p>
          )}
          <p style={{ margin: 0 }}>This will <strong>permanently delete</strong> this account and all associated data. This action cannot be undone.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, userId: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteDialog.userId!)} variant="contained" color="error">Delete Permanently</Button>
        </DialogActions>
      </Dialog>

      {/* Demote to User dialog */}
      <Dialog open={demoteDialog.open} onClose={() => setDemoteDialog({ open: false, row: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Demote to User</DialogTitle>
        <DialogContent>
          <p style={{ margin: 0 }}>Demote <strong>{demoteDialog.row?.email}</strong> to User? They will lose admin/moderator access.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDemoteDialog({ open: false, row: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmDemote} variant="contained" color="error">Demote</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk ban confirmation */}
      <Dialog open={bulkBanDialog} onClose={() => setBulkBanDialog(false)} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>Ban {selectedIds.ids.size} Users</DialogTitle>
        <DialogContent>
          <p style={{ margin: 0 }}>This will ban <strong style={{ color: '#fca5a5' }}>{selectedIds.ids.size} selected user(s)</strong>. They will be blocked from logging in and a notification email will be sent to each.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkBanDialog(false)} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button
            onClick={async () => {
              await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds.ids), action: 'ban' }),
              });
              setSnackbar({ open: true, message: `Banned ${selectedIds.ids.size} users` });
              setSelectedIds(emptySelection());
              setBulkBanDialog(false);
              mutate();
            }}
            variant="contained" color="error"
          >
            Ban {selectedIds.ids.size} Users
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk warn confirmation */}
      <Dialog open={bulkWarnDialog} onClose={() => setBulkWarnDialog(false)} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#fbbf24' }}>Warn {selectedIds.ids.size} Users</DialogTitle>
        <DialogContent>
          <p style={{ margin: 0 }}>This will issue a warning to <strong style={{ color: '#fde68a' }}>{selectedIds.ids.size} selected user(s)</strong>. Each user will receive a warning email. Users with 3 warnings are auto-banned.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkWarnDialog(false)} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button
            onClick={async () => {
              await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds.ids), action: 'warn' }),
              });
              setSnackbar({ open: true, message: `Warned ${selectedIds.ids.size} users` });
              setSelectedIds(emptySelection());
              setBulkWarnDialog(false);
              mutate();
            }}
            variant="contained"
            sx={{ background: '#fbbf24', '&:hover': { background: '#d97706' }, color: '#000' }}
          >
            Warn {selectedIds.ids.size} Users
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Activity Dialog */}
      <UserActivityDialog
        open={activityDialog.open}
        userId={activityDialog.userId}
        onClose={() => setActivityDialog({ open: false, userId: null })}
      />

      {/* Bulk floating action bar */}
      {selectedIds.ids.size > 0 && (
        <Box sx={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          background: '#232336',
          border: '1px solid #37376b',
          borderRadius: 3,
          px: 3,
          py: 1.5,
          boxShadow: '0 8px 32px #0008',
          zIndex: 1400,
        }}>
          <span style={{ color: '#9ca3af', fontSize: 14 }}>{selectedIds.ids.size} selected</span>
          <Button
            variant="contained"
            color="error"
            size="small"
            sx={{ fontWeight: 700, textTransform: 'none' }}
            onClick={() => setBulkBanDialog(true)}
          >
            Ban Selected ({selectedIds.ids.size})
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ background: '#fbbf24', '&:hover': { background: '#d97706' }, fontWeight: 700, textTransform: 'none', color: '#000' }}
            onClick={() => setBulkWarnDialog(true)}
          >
            Warn Selected ({selectedIds.ids.size})
          </Button>
        </Box>
      )}
    </Box>
  );
}
