"use client";
import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridSortModel,
  GridRowSelectionModel,
  GridRowId,
} from '@mui/x-data-grid';
import {
  Box, TextField, MenuItem, Select, InputLabel, FormControl, Alert,
  Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Badge, Typography,
} from '@mui/material';
import ResponsiveDataView, { AdminCard, CardActionsMenu } from '@/components/admin/ResponsiveDataView';
import { ADMIN_GRID_SX } from '@/components/admin/adminGridStyles';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';

import { useReviews } from './useReviews';
import Snackbar from '@mui/material/Snackbar';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useRouter, useSearchParams } from 'next/navigation';

const DATAGRID_SX = ADMIN_GRID_SX;

function fmtDate(val: any): React.ReactNode {
  if (!val) return <span style={{ color: '#4b5563' }}>—</span>;
  const d = new Date(val);
  const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (daysAgo === 0) return <span style={{ color: '#4ade80', fontSize: 12 }}>Today</span>;
  if (daysAgo === 1) return <span style={{ color: '#86efac', fontSize: 12 }}>Yesterday</span>;
  if (daysAgo < 7) return <span style={{ fontSize: 12, color: '#94a3b8' }}>{daysAgo}d ago</span>;
  const isThisYear = d.getFullYear() === new Date().getFullYear();
  return (
    <span style={{ color: '#94a3b8', fontSize: 12 }}>
      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(isThisYear ? {} : { year: '2-digit' }) })}
    </span>
  );
}

export default function ModerationReviewsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [q, setQ] = React.useState('');
  const [contentType, setContentType] = React.useState<string>('');
  const [minRating, setMinRating] = React.useState<string>('');
  const [maxRating, setMaxRating] = React.useState<string>('');
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  const [ipHashFilter, setIpHashFilter] = React.useState<string>('');
  const [guestOnly, setGuestOnly] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const emptySelection = (): GridRowSelectionModel => ({ type: 'include', ids: new Set<GridRowId>() });
  const [selectedIds, setSelectedIds] = React.useState<GridRowSelectionModel>(emptySelection);
  const [bulkDeleteDialog, setBulkDeleteDialog] = React.useState(false);
  const [hideAllIpDialog, setHideAllIpDialog] = React.useState(false);
  const dq = useDebouncedValue(q, 300);
  const dMinRating = useDebouncedValue(minRating, 400);
  const dMaxRating = useDebouncedValue(maxRating, 400);

  // Initialize from URL
  React.useEffect(() => {
    const qp = new URLSearchParams(searchParams as any);
    const page = parseInt(qp.get('page') || '0', 10);
    const pageSize = parseInt(qp.get('pageSize') || '10', 10);
    const q0 = qp.get('q') || '';
    const ct0 = qp.get('contentType') || '';
    const sortBy0 = qp.get('sortBy');
    const sortOrder0 = (qp.get('sortOrder') as 'asc' | 'desc') || undefined;
    const ipHash0 = qp.get('ipHash') || '';
    setPaginationModel({ page: isNaN(page) ? 0 : page, pageSize: isNaN(pageSize) ? 10 : pageSize });
    setQ(q0);
    setContentType(ct0);
    if (ipHash0) { setIpHashFilter(ipHash0); setShowFilters(true); }
    if (sortBy0 && sortOrder0) setSortModel([{ field: sortBy0, sort: sortOrder0 } as any]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to URL
  React.useEffect(() => {
    const qp = new URLSearchParams();
    if (paginationModel.page) qp.set('page', String(paginationModel.page));
    if (paginationModel.pageSize !== 10) qp.set('pageSize', String(paginationModel.pageSize));
    if (dq) qp.set('q', dq);
    if (contentType) qp.set('contentType', contentType);
    if (ipHashFilter) qp.set('ipHash', ipHashFilter);
    const sf = sortModel[0]?.field;
    const sd = sortModel[0]?.sort;
    if (sf && sd) { qp.set('sortBy', String(sf)); qp.set('sortOrder', String(sd)); }
    const query = qp.toString();
    router.replace(`?${query}`);
  }, [dq, contentType, paginationModel.page, paginationModel.pageSize, sortModel, router, ipHashFilter]);

  const sortField = sortModel[0]?.field;
  const sortDir = (sortModel[0]?.sort || 'desc') as 'asc' | 'desc';
  const sortBy: 'createdAt' | 'rating' = sortField === 'rating' ? 'rating' : 'createdAt';

  const { rows: reviews, total, isLoading, error, mutate } = useReviews({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    sortBy,
    sortOrder: sortDir,
    q: dq || undefined,
    contentType: contentType || undefined,
    minRating: dMinRating !== '' ? Number(dMinRating) : undefined,
    maxRating: dMaxRating !== '' ? Number(dMaxRating) : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    ipHash: ipHashFilter || undefined,
    guestOnly,
  });
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; reviewId: string | null }>({ open: false, reviewId: null });
  const [editDialog, setEditDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [editText, setEditText] = React.useState('');

  async function handleSaveEdit() {
    const row = editDialog.row;
    if (!row) return;
    try {
      await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, text: editText }),
      });
      setSnackbar({ open: true, message: 'Review updated' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error updating review' });
    }
    setEditDialog({ open: false, row: null });
    setEditText('');
  }

  async function handleToggleHide(row: any) {
    const nextHidden = !row.isHidden;
    try {
      const body: any = { id: row.id, isHidden: nextHidden };
      if (!nextHidden) body.hideReason = null;
      await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSnackbar({ open: true, message: nextHidden ? 'Review hidden' : 'Review unhidden' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error updating review visibility' });
    }
  }

  async function handleHideAllFromIp() {
    if (!ipHashFilter) return;
    try {
      const allForIp = await fetch(`/api/admin/reviews?ipHash=${encodeURIComponent(ipHashFilter)}&pageSize=500`);
      if (!allForIp.ok) throw new Error('Failed to load reviews for IP');
      const data = await allForIp.json();
      const ids: string[] = (data?.data ?? []).filter((r: any) => !r.isHidden).map((r: any) => r.id);
      if (ids.length === 0) {
        setSnackbar({ open: true, message: 'All reviews from this IP are already hidden' });
        setHideAllIpDialog(false);
        return;
      }
      const res = await fetch('/api/admin/reviews/batch-hide', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, isHidden: true }),
      });
      const result = await res.json();
      if (res.ok) {
        setSnackbar({ open: true, message: `Hidden ${result.updated} review(s) from this IP` });
        mutate();
      } else {
        setSnackbar({ open: true, message: result.error || 'Error hiding reviews' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Error hiding reviews from IP' });
    }
    setHideAllIpDialog(false);
  }

  async function handleDelete(reviewId: string) {
    try {
      await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId }),
      });
      setSnackbar({ open: true, message: 'Review deleted' });
      setSelectedIds(prev => {
        if (!prev.ids.has(reviewId)) return prev;
        const next = new Set(prev.ids);
        next.delete(reviewId);
        return { ...prev, ids: next };
      });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting review' });
    }
    setDeleteDialog({ open: false, reviewId: null });
  }

  async function handleBulkDelete() {
    try {
      const ids = Array.from(selectedIds.ids);
      const res = await fetch('/api/admin/reviews/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok) {
        setSnackbar({ open: true, message: `Deleted ${data.deleted} review(s)` });
        setSelectedIds(emptySelection());
        mutate();
      } else {
        setSnackbar({ open: true, message: data.error || 'Error deleting reviews' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Error deleting reviews' });
    }
    setBulkDeleteDialog(false);
  }

  function handleFilterByIpHash(ipHash: string) {
    setIpHashFilter(ipHash);
    setShowFilters(true);
    setPaginationModel(p => ({ ...p, page: 0 }));
  }

  const typeColor: Record<string, string> = { MOVIE: '#e879f9', TV_SHOW: '#38bdf8', KIDS: '#a78bfa' };

  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: 'User',
      flex: 1.0,
      minWidth: 150,
      valueGetter: (_value: any, row: any) => row?.user?.email || row?.guestName || '',
      renderCell: (params: any) => {
        const email = params.row?.user?.email || params.row?.guestName;
        return (
          <span style={{ color: params.row?.user?.email ? '#a78bfa' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%', fontSize: 13 }}>
            {email || 'Anonymous'}
          </span>
        );
      },
    },
    {
      field: 'contentTitle',
      headerName: 'Content',
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_value: any, row: any) => row?.content?.title || '',
      renderCell: (params: any) => {
        const title = params.row?.content?.title;
        const type = params.row?.content?.contentType;
        const c = typeColor[type] || '#9ca3af';
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', overflow: 'hidden' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0', fontSize: 13, minWidth: 0 }}>{title || '—'}</span>
            {type && <span style={{ fontSize: 9, fontWeight: 700, color: c, background: `${c}22`, border: `1px solid ${c}44`, borderRadius: 3, padding: '1px 4px', flexShrink: 0, lineHeight: '14px' }}>{type.replace('_', ' ')}</span>}
          </span>
        );
      },
    },
    {
      field: 'text',
      headerName: 'Review',
      flex: 2.0,
      minWidth: 200,
      renderCell: (params: any) => (
        <Tooltip title={params.value || 'No text review'} arrow placement="top">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%', color: params.value ? '#e2e8f0' : '#4b5563', fontStyle: params.value ? 'normal' : 'italic', fontSize: 13 }}>
            {params.value || 'No text'}
          </span>
        </Tooltip>
      ),
    },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 65,
      sortable: true,
      renderCell: (params: any) => {
        const r = params.value;
        const color = r >= 8 ? '#ef4444' : r >= 5 ? '#fbbf24' : '#4ade80';
        return <span style={{ fontWeight: 700, color, fontSize: 13 }}>{r}</span>;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 85,
      sortable: true,
      renderCell: (params: any) => fmtDate(params.row?.createdAt),
    },
    {
      field: 'ipHashCount',
      headerName: 'IP',
      width: 85,
      sortable: false,
      renderCell: (params: any) => {
        const count = params.row?.ipHashCount;
        const ipHash = params.row?.ipHash;
        if (!ipHash) return <span style={{ color: '#374151', fontSize: 12 }}>—</span>;
        return (
          <Tooltip title={`${count} review(s) from this IP — click to filter`} arrow>
            <Chip
              label={`${count} from IP`}
              size="small"
              onClick={() => handleFilterByIpHash(ipHash)}
              sx={{
                cursor: 'pointer',
                fontSize: 10,
                height: 20,
                background: count > 2 ? '#7f1d1d' : '#1c1c2e',
                color: count > 2 ? '#fca5a5' : '#9ca3af',
                border: count > 2 ? '1px solid #ef4444' : '1px solid #374151',
                '&:hover': { background: count > 2 ? '#991b1b' : '#2d2d44' },
                '& .MuiChip-label': { px: '6px' },
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      field: 'isHidden',
      headerName: 'Status',
      width: 85,
      renderCell: (params: any) => {
        if (params.row.isHidden) {
          const reason = params.row.hideReason;
          const chip = (
            <Chip label="Hidden" size="small" sx={{ fontSize: 10, height: 20, background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', fontWeight: 700, cursor: reason ? 'help' : 'default', '& .MuiChip-label': { px: '6px' } }} />
          );
          return reason ? <Tooltip title={`Reason: ${reason}`} arrow>{chip}</Tooltip> : chip;
        }
        return <Chip label="Visible" color="success" size="small" sx={{ fontSize: 10, height: 20, '& .MuiChip-label': { px: '6px' } }} />;
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 110,
      getActions: (params: import('@mui/x-data-grid').GridRowParams) => [
        <GridActionsCellItem key="edit" icon={<EditIcon sx={{ color: '#38bdf8', fontSize: 18 }} />} label="Edit" onClick={() => { setEditText(params.row.text || ''); setEditDialog({ open: true, row: params.row }); }} showInMenu={false} />,
        params.row.isHidden
          ? <GridActionsCellItem key="unhide" icon={<VisibilityIcon color="success" sx={{ fontSize: 18 }} />} label="Unhide" onClick={() => handleToggleHide(params.row)} showInMenu={false} />
          : <GridActionsCellItem key="hide" icon={<VisibilityOffIcon color="warning" sx={{ fontSize: 18 }} />} label="Hide" onClick={() => handleToggleHide(params.row)} showInMenu={false} />,
        <GridActionsCellItem key="delete" icon={<DeleteIcon color="error" sx={{ fontSize: 18 }} />} label="Delete" onClick={() => setDeleteDialog({ open: true, reviewId: params.row.id })} showInMenu={false} />,
      ],
    },
  ];

  const hasActiveFilters = minRating || maxRating || dateFrom || dateTo || ipHashFilter;

  const renderCard = (row: any) => {
    const email = row?.user?.email || row?.guestName || 'Anonymous';
    const r = row.rating;
    const ratingColor = r >= 8 ? '#ef4444' : r >= 5 ? '#fbbf24' : '#4ade80';
    const type = row?.content?.contentType;
    const tc = typeColor[type] || '#9ca3af';
    return (
      <AdminCard accent={row.isHidden ? '#ef4444' : undefined}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
          <Typography sx={{ fontSize: 13, color: row.text ? '#e2e8f0' : '#6b7280', fontStyle: row.text ? 'normal' : 'italic', wordBreak: 'break-word', minWidth: 0 }}>
            {row.text || 'No text'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Box component="span" sx={{ fontWeight: 700, color: ratingColor, fontSize: 14 }}>{r}</Box>
            <CardActionsMenu
              actions={[
                { label: 'Edit', icon: <EditIcon fontSize="small" />, color: '#38bdf8', onClick: () => { setEditText(row.text || ''); setEditDialog({ open: true, row }); } },
                row.isHidden
                  ? { label: 'Unhide', icon: <VisibilityIcon fontSize="small" />, color: '#22c55e', onClick: () => handleToggleHide(row) }
                  : { label: 'Hide', icon: <VisibilityOffIcon fontSize="small" />, color: '#fbbf24', onClick: () => handleToggleHide(row) },
                { label: 'Delete', icon: <DeleteIcon fontSize="small" />, color: '#ef4444', onClick: () => setDeleteDialog({ open: true, reviewId: row.id }) },
              ]}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', mt: 0.75 }}>
          <Typography sx={{ fontSize: 12, color: row?.user?.email ? '#a78bfa' : '#9ca3af' }}>{email}</Typography>
          <Typography sx={{ fontSize: 12, color: '#6b7280' }}>·</Typography>
          <Typography sx={{ fontSize: 12, color: '#e2e8f0' }}>{row?.content?.title || '—'}</Typography>
          {type && (
            <Box component="span" sx={{ fontSize: 9, fontWeight: 700, color: tc, background: `${tc}22`, border: `1px solid ${tc}44`, borderRadius: '3px', px: '4px' }}>
              {type.replace('_', ' ')}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
          <Box component="span" sx={{ fontSize: 12, color: '#6b7280' }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : ''}</Box>
          {row.isHidden && <Chip label="Hidden" size="small" sx={{ fontSize: 10, height: 18, background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', '& .MuiChip-label': { px: '6px' } }} />}
          {row.ipHash && (row.ipHashCount ?? 0) > 1 && (
            <Chip
              label={`${row.ipHashCount} from IP`}
              size="small"
              onClick={() => handleFilterByIpHash(row.ipHash)}
              sx={{ fontSize: 10, height: 18, cursor: 'pointer', background: row.ipHashCount > 2 ? '#7f1d1d' : '#1c1c2e', color: row.ipHashCount > 2 ? '#fca5a5' : '#9ca3af', border: row.ipHashCount > 2 ? '1px solid #ef4444' : '1px solid #374151', '& .MuiChip-label': { px: '6px' } }}
            />
          )}
        </Box>
      </AdminCard>
    );
  };

  return (
    <Box sx={{ width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, mb: 3, color: '#f3f4f6' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load reviews. Please try again.</Alert>}

      {/* Primary filter row */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          placeholder="Search text, user, title..."
          InputProps={{ sx: { color: '#fff', fontSize: 13 } }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="ctype-label" sx={{ color: '#fff', fontSize: 13 }}>Content Type</InputLabel>
          <Select
            labelId="ctype-label"
            label="Content Type"
            value={contentType}
            onChange={(e) => { setContentType(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
            sx={{ color: '#fff', fontSize: 13 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="MOVIE">Movie</MenuItem>
            <MenuItem value="TV_SHOW">TV Show</MenuItem>
            <MenuItem value="KIDS">Kids</MenuItem>
          </Select>
        </FormControl>
        <Badge badgeContent={hasActiveFilters ? '!' : 0} color="warning">
          <Button
            size="small"
            startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
            onClick={() => setShowFilters(f => !f)}
            variant={showFilters ? 'contained' : 'outlined'}
            sx={{ color: showFilters ? '#000' : '#a78bfa', borderColor: '#a78bfa', background: showFilters ? '#a78bfa' : 'transparent', fontSize: 12, textTransform: 'none' }}
          >
            Filters
          </Button>
        </Badge>
        <Button
          size="small"
          startIcon={<PersonOffOutlinedIcon sx={{ fontSize: 16 }} />}
          onClick={() => { setGuestOnly(g => !g); setPaginationModel(p => ({ ...p, page: 0 })); }}
          variant={guestOnly ? 'contained' : 'outlined'}
          title="Show only guest (anonymous) reviews — these carry IP data"
          sx={{ color: guestOnly ? '#000' : '#38bdf8', borderColor: '#38bdf8', background: guestOnly ? '#38bdf8' : 'transparent', '&:hover': { borderColor: '#38bdf8', background: guestOnly ? '#38bdf8' : '#38bdf820' }, fontSize: 12, textTransform: 'none' }}
        >
          Guest only
        </Button>
        {ipHashFilter && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityOffOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setHideAllIpDialog(true)}
            sx={{ borderColor: '#f97316', color: '#f97316', '&:hover': { background: '#f9731620' }, fontSize: 12, textTransform: 'none' }}
          >
            Hide all from IP
          </Button>
        )}
        {selectedIds.ids.size > 0 && (
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
            onClick={() => setBulkDeleteDialog(true)}
            sx={{ ml: 'auto', fontSize: 12, textTransform: 'none' }}
          >
            Delete {selectedIds.ids.size} selected
          </Button>
        )}
      </Box>

      {/* Advanced filters panel */}
      {showFilters && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center', background: '#1a1a2e', borderRadius: 1, p: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel sx={{ color: '#9ca3af', fontSize: 12 }}>Min Rating</InputLabel>
            <Select label="Min Rating" value={minRating} onChange={(e) => { setMinRating(e.target.value as string); setPaginationModel(p => ({ ...p, page: 0 })); }} sx={{ color: '#fff', fontSize: 12 }}>
              <MenuItem value="">Any</MenuItem>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <MenuItem key={n} value={n} sx={{ fontSize: 12 }}>{n}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel sx={{ color: '#9ca3af', fontSize: 12 }}>Max Rating</InputLabel>
            <Select label="Max Rating" value={maxRating} onChange={(e) => { setMaxRating(e.target.value as string); setPaginationModel(p => ({ ...p, page: 0 })); }} sx={{ color: '#fff', fontSize: 12 }}>
              <MenuItem value="">Any</MenuItem>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <MenuItem key={n} value={n} sx={{ fontSize: 12 }}>{n}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="From" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }} InputLabelProps={{ shrink: true, sx: { color: '#9ca3af', fontSize: 12 } }} InputProps={{ sx: { color: '#fff', fontSize: 12 } }} sx={{ minWidth: 130 }} />
          <TextField size="small" type="date" label="To" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }} InputLabelProps={{ shrink: true, sx: { color: '#9ca3af', fontSize: 12 } }} InputProps={{ sx: { color: '#fff', fontSize: 12 } }} sx={{ minWidth: 130 }} />
          <TextField size="small" value={ipHashFilter} onChange={(e) => { setIpHashFilter(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }} placeholder="IP hash..." InputProps={{ sx: { color: '#fff', fontSize: 11 } }} sx={{ minWidth: 180 }} />
          {hasActiveFilters && (
            <Button size="small" onClick={() => { setMinRating(''); setMaxRating(''); setDateFrom(''); setDateTo(''); setIpHashFilter(''); setPaginationModel(p => ({ ...p, page: 0 })); }} sx={{ color: '#ef4444', fontSize: 12, textTransform: 'none' }}>
              Clear filters
            </Button>
          )}
        </Box>
      )}

      <ResponsiveDataView
        rows={reviews}
        loading={isLoading}
        renderCard={renderCard}
        emptyMessage="No reviews found"
        rowCount={total}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        desktop={
          <Box sx={{ height: 540 }}>
            <DataGrid
              rows={reviews}
              columns={columns}
              rowCount={total}
              paginationMode="server"
              sortingMode="server"
              loading={isLoading}
              checkboxSelection
              rowSelectionModel={selectedIds}
              onRowSelectionModelChange={(model) => setSelectedIds(model)}
              slots={{ noRowsOverlay: () => <Box sx={{ p: 2, color: '#9ca3af' }}>No reviews found</Box> }}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              onSortModelChange={(model) => setSortModel(model)}
              pageSizeOptions={[10, 20, 50]}
              autoHeight={false}
              disableRowSelectionOnClick
              sx={DATAGRID_SX}
            />
          </Box>
        }
      />

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })} message={snackbar.message} />

      {/* Single delete confirmation */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, reviewId: null })} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Review</DialogTitle>
        <DialogContent>
          <p style={{ margin: 0 }}>Are you sure you want to permanently delete this review? This action cannot be undone.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, reviewId: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteDialog.reviewId!)} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk delete confirmation */}
      <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>Bulk Delete Reviews</DialogTitle>
        <DialogContent>
          <p style={{ margin: 0 }}>
            You are about to permanently delete <strong style={{ color: '#fca5a5' }}>{selectedIds.ids.size} review(s)</strong>.
            This will recalculate the woke scores for all affected content. This cannot be undone.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialog(false)} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={handleBulkDelete} variant="contained" color="error">Delete {selectedIds.ids.size} reviews</Button>
        </DialogActions>
      </Dialog>

      {/* Hide all from IP confirmation */}
      <Dialog open={hideAllIpDialog} onClose={() => setHideAllIpDialog(false)} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#f97316' }}>Hide All Reviews from This IP</DialogTitle>
        <DialogContent>
          <p style={{ margin: 0 }}>
            This will hide all <strong>visible</strong> reviews from IP hash <code style={{ background: '#1a1a2e', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{ipHashFilter}</code>.
            Hidden reviews are not deleted — they can be unhidden individually later.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHideAllIpDialog(false)} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={handleHideAllFromIp} variant="contained" sx={{ background: '#f97316', '&:hover': { background: '#ea580c' }, color: '#fff' }} startIcon={<VisibilityOffOutlinedIcon />}>
            Hide All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Review dialog */}
      <Dialog open={editDialog.open} onClose={() => { setEditDialog({ open: false, row: null }); setEditText(''); }} PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 480 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#38bdf8' }}>Edit Review Text</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth multiline minRows={4} maxRows={10} size="small"
            label="Review text" value={editText} onChange={(e) => setEditText(e.target.value)}
            InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: '#9ca3af' } }} sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditDialog({ open: false, row: null }); setEditText(''); }} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" sx={{ background: '#38bdf8', color: '#000' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
