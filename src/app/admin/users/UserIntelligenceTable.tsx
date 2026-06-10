"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem, GridSortModel } from '@mui/x-data-grid';
import {
  Box, TextField, Alert, Chip, Tooltip, Typography, ToggleButtonGroup, ToggleButton,
  FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/WarningAmber';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUsersWithStats, SortField } from './useUsersWithStats';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useRouter, useSearchParams } from 'next/navigation';
import UserActivityDialog from '../moderation/UserActivityDialog';
import { WARN_TEMPLATES, BAN_TEMPLATES } from '@/lib/moderation-templates';
import ResponsiveDataView, { AdminCard, CardActionsMenu } from '@/components/admin/ResponsiveDataView';
import { ADMIN_GRID_SX, ROLE_COLOR } from '@/components/admin/adminGridStyles';

type UserAction = { label: string; icon: React.ReactElement; onClick: () => void; color?: string; showInMenu?: boolean };

function accountAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`;
}

function fmtDate(val: any): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Unified Users management page. Combines the review-activity stats view with the
 * full moderation action set (ban/warn/role/delete) and a "Flagged only" filter —
 * the single destination for everything user-related (replaces the former separate
 * /admin/users, moderation "User" tab, and "Flagged Users" tab).
 *
 * Destructive and role-changing actions are gated behind `isAdmin`; warnings and
 * activity lookups are available to all staff.
 */
export default function UserIntelligenceTable({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 20 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: 'createdAt', sort: 'desc' }]);
  const [q, setQ] = React.useState('');
  const [role, setRole] = React.useState('');
  const [flagged, setFlagged] = React.useState(false);
  const dq = useDebouncedValue(q, 300);

  // Dialog + snackbar state
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [activityDialog, setActivityDialog] = React.useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [banDialog, setBanDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [banReason, setBanReason] = React.useState('');
  const [warnDialog, setWarnDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [warnReason, setWarnReason] = React.useState('');
  const [promoteDialog, setPromoteDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [moderatorDialog, setModeratorDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [demoteDialog, setDemoteDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; userId: string | null; email?: string }>({ open: false, userId: null });

  // Initialize filters from URL (so dashboard/search deep links land correctly).
  React.useEffect(() => {
    const qp = new URLSearchParams(searchParams as any);
    setQ(qp.get('q') || '');
    setRole(qp.get('role') || '');
    setFlagged(qp.get('flagged') === 'true');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortField = (sortModel[0]?.field || 'createdAt') as SortField;
  const sortOrder = (sortModel[0]?.sort || 'desc') as 'asc' | 'desc';

  const { rows, total, isLoading, error, mutate } = useUsersWithStats({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    sortBy: sortField,
    sortOrder,
    q: dq || undefined,
    role: role || undefined,
    flagged,
  });

  // ---- Mutations (all reuse the existing /api/admin/users endpoints) ----
  async function patchUser(body: any, okMsg: string, errMsg: string) {
    try {
      const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Request failed');
      setSnackbar({ open: true, message: okMsg });
      mutate();
    } catch {
      setSnackbar({ open: true, message: errMsg });
    }
  }

  async function confirmBan() {
    const row = banDialog.row;
    if (row) await patchUser({ id: row.id, isBanned: true, banReason: banReason || undefined }, 'User banned', 'Error banning user');
    setBanDialog({ open: false, row: null }); setBanReason('');
  }
  async function handleUnban(row: any) {
    await patchUser({ id: row.id, isBanned: false, banReason: null }, 'User unbanned', 'Error unbanning user');
  }
  async function confirmWarn() {
    const row = warnDialog.row;
    if (row) await patchUser({ id: row.id, warnDelta: 1, warnReason: warnReason || undefined }, 'Warning issued', 'Error warning user');
    setWarnDialog({ open: false, row: null }); setWarnReason('');
  }
  async function handleRemoveWarning(row: any) {
    await patchUser({ id: row.id, warnDelta: -1 }, 'Warning removed', 'Error removing warning');
  }
  async function confirmPromote() {
    const row = promoteDialog.row;
    if (row) await patchUser({ id: row.id, role: 'ADMIN' }, 'User promoted to admin', 'Error promoting user');
    setPromoteDialog({ open: false, row: null });
  }
  async function confirmModerator() {
    const row = moderatorDialog.row;
    if (row) await patchUser({ id: row.id, role: 'MODERATOR' }, 'User promoted to moderator', 'Error promoting user');
    setModeratorDialog({ open: false, row: null });
  }
  async function confirmDemote() {
    const row = demoteDialog.row;
    if (row) await patchUser({ id: row.id, role: 'USER' }, 'User demoted to User role', 'Error demoting user');
    setDemoteDialog({ open: false, row: null });
  }
  async function handleDelete(userId: string) {
    try {
      const res = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId }) });
      if (!res.ok) throw new Error('Request failed');
      setSnackbar({ open: true, message: 'User deleted' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting user' });
    }
    setDeleteDialog({ open: false, userId: null });
  }

  // Build the action list once; reused by the desktop grid and the mobile card menu.
  function actionsFor(row: any): UserAction[] {
    const actions: UserAction[] = [
      { label: 'View Activity', icon: <InfoIcon sx={{ color: '#38bdf8' }} fontSize="small" />, color: '#38bdf8', onClick: () => setActivityDialog({ open: true, userId: row.id }) },
    ];
    // Warnings are a moderator tool (available to all staff).
    if (row.warnCount > 0) {
      actions.push({ label: 'Remove Warning', icon: <RemoveCircleOutlineIcon sx={{ color: '#22c55e' }} fontSize="small" />, color: '#22c55e', onClick: () => handleRemoveWarning(row), showInMenu: true });
    }
    actions.push({ label: 'Warn', icon: <WarningIcon color="warning" fontSize="small" />, color: '#fbbf24', onClick: () => { setWarnReason(''); setWarnDialog({ open: true, row }); }, showInMenu: true });

    // Destructive / role-changing actions: admin only.
    if (isAdmin) {
      actions.push(
        row.isBanned
          ? { label: 'Unban', icon: <BlockIcon color="success" fontSize="small" />, color: '#22c55e', onClick: () => handleUnban(row), showInMenu: true }
          : { label: 'Ban', icon: <BlockIcon color="error" fontSize="small" />, color: '#ef4444', onClick: () => { setBanReason(''); setBanDialog({ open: true, row }); }, showInMenu: true }
      );
      if (row.role !== 'ADMIN') actions.push({ label: 'Promote to Admin', icon: <Box component="span" sx={{ fontWeight: 700, color: '#38bdf8' }}>A</Box>, color: '#38bdf8', onClick: () => setPromoteDialog({ open: true, row }), showInMenu: true });
      if (row.role === 'USER') actions.push({ label: 'Make Moderator', icon: <Box component="span" sx={{ fontWeight: 700, color: '#a78bfa' }}>M</Box>, color: '#a78bfa', onClick: () => setModeratorDialog({ open: true, row }), showInMenu: true });
      if (row.role !== 'USER') actions.push({ label: 'Demote to User', icon: <Box component="span" sx={{ fontWeight: 700, color: '#f87171' }}>↓</Box>, color: '#f87171', onClick: () => setDemoteDialog({ open: true, row }), showInMenu: true });
      actions.push({ label: 'Delete', icon: <DeleteIcon color="error" fontSize="small" />, color: '#ef4444', onClick: () => setDeleteDialog({ open: true, userId: row.id, email: row.email }), showInMenu: true });
    }
    return actions;
  }

  const columns: GridColDef[] = [
    {
      field: 'email', headerName: 'Email', flex: 1.8, minWidth: 200, sortable: true,
      renderCell: (params: any) => <span style={{ color: '#a78bfa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%' }}>{params.value}</span>,
    },
    {
      field: 'name', headerName: 'Name', flex: 1, minWidth: 120, sortable: false,
      renderCell: (params: any) => <span style={{ color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%' }}>{params.value || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>—</span>}</span>,
    },
    {
      field: 'role', headerName: 'Role', width: 110, sortable: true,
      renderCell: (params: any) => {
        const c = ROLE_COLOR[params.value] || '#6b7280';
        return <Chip label={params.value} size="small" sx={{ background: `${c}25`, color: c, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${c}50` }} />;
      },
    },
    {
      field: 'isBanned', headerName: 'Status', width: 100, sortable: false,
      renderCell: (params: any) => {
        if (params.row.isBanned) return <Tooltip title={params.row.banReason || 'No reason given'} arrow><Chip label="Banned" size="small" sx={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', fontWeight: 700, fontSize: '0.72rem' }} /></Tooltip>;
        if (params.row.warnCount > 0) return <Chip label={`${params.row.warnCount} warn${params.row.warnCount > 1 ? 's' : ''}`} size="small" sx={{ background: '#78350f', color: '#fde68a', border: '1px solid #f59e0b', fontWeight: 700, fontSize: '0.72rem' }} />;
        return <Chip label="Active" size="small" color="success" sx={{ fontSize: '0.72rem' }} />;
      },
    },
    { field: 'createdAt', headerName: 'Joined', width: 120, sortable: true, valueFormatter: (value: any) => fmtDate(value) },
    {
      field: 'reviewCount', headerName: 'Reviews', width: 90, sortable: true,
      renderCell: (params: any) => {
        const count = params.row.reviewCount ?? 0;
        const color = count >= 50 ? '#a855f7' : count >= 10 ? '#38bdf8' : '#9ca3af';
        return <span style={{ fontWeight: count > 0 ? 700 : 400, color }}>{count}</span>;
      },
    },
    {
      field: 'avgRating', headerName: 'Avg Rating', width: 110, sortable: true,
      renderCell: (params: any) => {
        const avg = params.row.avgRating;
        if (avg === null || avg === undefined) return <span style={{ color: '#4b5563' }}>—</span>;
        const color = avg >= 8 ? '#ef4444' : avg >= 5 ? '#fbbf24' : '#4ade80';
        return <span style={{ fontWeight: 700, color }}>{avg.toFixed(1)} <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 11 }}>/ 10</span></span>;
      },
    },
    {
      field: 'lastReview', headerName: 'Last Review', width: 125, sortable: true,
      renderCell: (params: any) => {
        const val = params.row.lastReview;
        if (!val) return <span style={{ color: '#4b5563' }}>—</span>;
        const daysAgo = Math.floor((Date.now() - new Date(val).getTime()) / 86400000);
        const fresh = daysAgo <= 7;
        return <Tooltip title={fmtDate(val)} arrow><span style={{ color: fresh ? '#4ade80' : '#9ca3af', fontSize: 13 }}>{daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`}</span></Tooltip>;
      },
    },
    {
      field: 'actions', type: 'actions', headerName: '', width: 90,
      getActions: (params) => actionsFor(params.row).map((a) => (
        <GridActionsCellItem key={a.label} icon={a.icon} label={a.label} onClick={a.onClick} showInMenu={a.showInMenu} />
      )),
    },
  ];

  const renderCard = (row: any) => {
    const c = ROLE_COLOR[row.role] || '#6b7280';
    return (
      <AdminCard accent={row.isBanned ? '#ef4444' : row.warnCount > 0 ? '#f59e0b' : undefined}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: '#a78bfa', fontSize: 13, fontWeight: 600, wordBreak: 'break-all' }}>{row.email}</Typography>
            {row.name && <Typography sx={{ color: '#e2e8f0', fontSize: 12 }}>{row.name}</Typography>}
          </Box>
          <CardActionsMenu actions={actionsFor(row).map((a) => ({ label: a.label, icon: a.icon, onClick: a.onClick, color: a.color }))} />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', mt: 0.75 }}>
          <Chip label={row.role} size="small" sx={{ background: `${c}25`, color: c, fontWeight: 700, fontSize: '0.68rem', height: 20, border: `1px solid ${c}50`, '& .MuiChip-label': { px: '6px' } }} />
          {row.isBanned
            ? <Chip label="Banned" size="small" sx={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', fontWeight: 700, fontSize: '0.68rem', height: 20, '& .MuiChip-label': { px: '6px' } }} />
            : row.warnCount > 0
              ? <Chip label={`${row.warnCount} warn${row.warnCount > 1 ? 's' : ''}`} size="small" sx={{ background: '#78350f', color: '#fde68a', border: '1px solid #f59e0b', fontWeight: 700, fontSize: '0.68rem', height: 20, '& .MuiChip-label': { px: '6px' } }} />
              : <Chip label="Active" size="small" color="success" sx={{ fontSize: '0.68rem', height: 20, '& .MuiChip-label': { px: '6px' } }} />}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 0.75, color: '#9ca3af', fontSize: 12 }}>
          <span>{row.reviewCount ?? 0} reviews</span>
          {row.avgRating != null && <span>avg {row.avgRating.toFixed(1)}/10</span>}
          <span>joined {fmtDate(row.createdAt)}</span>
          {row.createdAt && <span>· {accountAge(row.createdAt)}</span>}
        </Box>
      </AdminCard>
    );
  };

  return (
    <Box sx={{ width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, color: '#f3f4f6' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load users. Please try again.</Alert>}

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          placeholder="Search by email or name..."
          InputProps={{ sx: { color: '#fff' } }}
          sx={{ minWidth: 240, maxWidth: '100%', flex: '1 1 240px' }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel sx={{ color: '#9ca3af' }}>Role</InputLabel>
          <Select label="Role" value={role} onChange={(e) => { setRole(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }} sx={{ color: '#fff' }}>
            <MenuItem value="">All roles</MenuItem>
            <MenuItem value="USER">User</MenuItem>
            <MenuItem value="MODERATOR">Moderator</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </Select>
        </FormControl>
        <ToggleButtonGroup
          value={flagged ? 'flagged' : 'all'}
          exclusive
          size="small"
          onChange={(_, v) => { if (v) { setFlagged(v === 'flagged'); setPaginationModel(p => ({ ...p, page: 0 })); } }}
          sx={{ '& .MuiToggleButton-root': { color: '#9ca3af', borderColor: '#374151', fontSize: 12, textTransform: 'none' }, '& .Mui-selected': { color: '#fbbf24 !important', background: '#37376b !important' } }}
        >
          <ToggleButton value="all">All users</ToggleButton>
          <ToggleButton value="flagged">Flagged only</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <ResponsiveDataView
        rows={rows}
        loading={isLoading}
        renderCard={renderCard}
        emptyMessage={flagged ? 'No flagged users — all clear ✓' : 'No users found'}
        rowCount={total}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        desktop={
          <Box sx={{ height: 620 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              rowCount={total}
              paginationMode="server"
              sortingMode="server"
              loading={isLoading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortModel={sortModel}
              onSortModelChange={(model) => { setSortModel(model); setPaginationModel(p => ({ ...p, page: 0 })); }}
              pageSizeOptions={[20, 50, 100]}
              autoHeight={false}
              disableRowSelectionOnClick
              slots={{ noRowsOverlay: () => <Box sx={{ p: 2, color: '#9ca3af' }}>{flagged ? 'No flagged users — all clear ✓' : 'No users found'}</Box> }}
              sx={ADMIN_GRID_SX}
            />
          </Box>
        }
      />

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })} message={snackbar.message} />

      {/* Ban dialog */}
      <Dialog open={banDialog.open} onClose={() => setBanDialog({ open: false, row: null })} fullWidth maxWidth="sm" PaperProps={{ sx: { background: '#232336', color: '#fff' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Ban {banDialog.row?.email}</DialogTitle>
        <DialogContent>
          <FormControl size="small" fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel sx={{ color: '#9ca3af' }}>Template (optional)</InputLabel>
            <Select label="Template (optional)" value="" onChange={(e) => { const t = BAN_TEMPLATES.find((x) => x.key === e.target.value); if (t) setBanReason(t.body); }} sx={{ color: '#fff' }}>
              {BAN_TEMPLATES.map((t) => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField autoFocus fullWidth size="small" multiline minRows={3} label="Reason (optional)" value={banReason} onChange={(e) => setBanReason(e.target.value)} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#9ca3af' } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialog({ open: false, row: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmBan} variant="contained" color="error">Ban User</Button>
        </DialogActions>
      </Dialog>

      {/* Warn dialog */}
      <Dialog open={warnDialog.open} onClose={() => setWarnDialog({ open: false, row: null })} fullWidth maxWidth="sm" PaperProps={{ sx: { background: '#232336', color: '#fff' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Warn {warnDialog.row?.email}</DialogTitle>
        <DialogContent>
          <FormControl size="small" fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel sx={{ color: '#9ca3af' }}>Template (optional)</InputLabel>
            <Select label="Template (optional)" value="" onChange={(e) => { const t = WARN_TEMPLATES.find((x) => x.key === e.target.value); if (t) setWarnReason(t.body); }} sx={{ color: '#fff' }}>
              {WARN_TEMPLATES.map((t) => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField autoFocus fullWidth size="small" multiline minRows={3} label="Reason (optional)" value={warnReason} onChange={(e) => setWarnReason(e.target.value)} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#9ca3af' } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarnDialog({ open: false, row: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmWarn} variant="contained" sx={{ background: '#fbbf24', '&:hover': { background: '#d97706' }, color: '#000' }}>Issue Warning</Button>
        </DialogActions>
      </Dialog>

      {/* Promote to Admin dialog */}
      <Dialog open={promoteDialog.open} onClose={() => setPromoteDialog({ open: false, row: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Promote to Admin</DialogTitle>
        <DialogContent><p>Promote <strong>{promoteDialog.row?.email}</strong> to Admin? They will have full access to this admin panel.</p></DialogContent>
        <DialogActions>
          <Button onClick={() => setPromoteDialog({ open: false, row: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmPromote} variant="contained" sx={{ background: '#38bdf8' }}>Promote</Button>
        </DialogActions>
      </Dialog>

      {/* Make Moderator dialog */}
      <Dialog open={moderatorDialog.open} onClose={() => setModeratorDialog({ open: false, row: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Make Moderator</DialogTitle>
        <DialogContent><p>Promote <strong>{moderatorDialog.row?.email}</strong> to Moderator? They will be able to moderate reviews and content.</p></DialogContent>
        <DialogActions>
          <Button onClick={() => setModeratorDialog({ open: false, row: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmModerator} variant="contained" sx={{ background: '#a78bfa' }}>Make Moderator</Button>
        </DialogActions>
      </Dialog>

      {/* Demote to User dialog */}
      <Dialog open={demoteDialog.open} onClose={() => setDemoteDialog({ open: false, row: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Demote to User</DialogTitle>
        <DialogContent><p style={{ margin: 0 }}>Demote <strong>{demoteDialog.row?.email}</strong> to User? They will lose admin/moderator access.</p></DialogContent>
        <DialogActions>
          <Button onClick={() => setDemoteDialog({ open: false, row: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmDemote} variant="contained" color="error">Demote</Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, userId: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>Delete User</DialogTitle>
        <DialogContent>
          {deleteDialog.email && <p style={{ margin: '0 0 12px', color: '#fca5a5' }}><strong>{deleteDialog.email}</strong></p>}
          <p style={{ margin: 0 }}>This will <strong>permanently delete</strong> this account and all associated data. This action cannot be undone.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, userId: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteDialog.userId!)} variant="contained" color="error">Delete Permanently</Button>
        </DialogActions>
      </Dialog>

      <UserActivityDialog open={activityDialog.open} userId={activityDialog.userId} onClose={() => setActivityDialog({ open: false, userId: null })} />
    </Box>
  );
}
