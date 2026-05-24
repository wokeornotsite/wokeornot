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
  Button, FormControlLabel, Switch, Badge,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

import { useReviews } from './useReviews';
import Snackbar from '@mui/material/Snackbar';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useRouter, useSearchParams } from 'next/navigation';

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
      // Remove from selection if it was checked, so the bulk-delete count stays accurate
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

  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: 'User',
      flex: 1,
      minWidth: 160,
      valueGetter: (_value: any, row: any) => row?.user?.email || row?.guestName || '',
      renderCell: (params: any) => {
        const email = params.row?.user?.email || params.row?.guestName;
        return (
          <span style={{ color: params.row?.user?.email ? '#a78bfa' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%' }}>
            {email || 'Anonymous'}
          </span>
        );
      },
    },
    {
      field: 'contentTitle',
      headerName: 'Content',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_value: any, row: any) => row?.content?.title || '',
      renderCell: (params: any) => {
        const title = params.row?.content?.title;
        const type = params.row?.content?.contentType;
        const typeColor: Record<string, string> = { MOVIE: '#e879f9', TV_SHOW: '#38bdf8', KIDS: '#a78bfa' };
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', overflow: 'hidden' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>{title || '—'}</span>
            {type && <span style={{ fontSize: 10, fontWeight: 700, color: typeColor[type] || '#9ca3af', background: `${typeColor[type] || '#9ca3af'}18`, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{type}</span>}
          </span>
        );
      },
    },
    {
      field: 'text',
      headerName: 'Review Text',
      flex: 2,
      minWidth: 160,
      renderCell: (params: any) => (
        <Tooltip title={params.value || 'No text review'} arrow placement="top">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%', color: params.value ? '#e2e8f0' : '#6b7280', fontStyle: params.value ? 'normal' : 'italic' }}>
            {params.value || 'No text review'}
          </span>
        </Tooltip>
      ),
    },
    { field: 'rating', headerName: 'Rating', width: 80, sortable: true },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 160,
      type: 'dateTime',
      valueGetter: (_value: any, row: any) => (row?.createdAt ? new Date(row.createdAt) : null),
      sortable: true,
    },
    {
      field: 'ipHashCount',
      headerName: 'IP Reviews',
      width: 110,
      sortable: false,
      renderCell: (params: any) => {
        const count = params.row?.ipHashCount;
        const ipHash = params.row?.ipHash;
        if (!ipHash) return <span style={{ color: '#4b5563', fontSize: 12 }}>—</span>;
        return (
          <Tooltip title={`${count} review(s) from this IP — click to filter`} arrow>
            <Chip
              label={`${count} from IP`}
              size="small"
              onClick={() => handleFilterByIpHash(ipHash)}
              sx={{
                cursor: 'pointer',
                fontSize: 11,
                background: count > 2 ? '#7f1d1d' : '#1c1c2e',
                color: count > 2 ? '#fca5a5' : '#9ca3af',
                border: count > 2 ? '1px solid #ef4444' : '1px solid #374151',
                '&:hover': { background: count > 2 ? '#991b1b' : '#2d2d44' },
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      field: 'isHidden',
      headerName: 'Status',
      width: 110,
      renderCell: (params: any) => {
        if (params.row.isHidden) {
          const reason = params.row.hideReason;
          const chip = (
            <Chip
              label="Hidden"
              size="small"
              sx={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', fontWeight: 700, cursor: reason ? 'help' : 'default' }}
            />
          );
          return reason ? <Tooltip title={`Reason: ${reason}`} arrow>{chip}</Tooltip> : chip;
        }
        return <Chip label="Visible" color="success" size="small" />;
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: import('@mui/x-data-grid').GridRowParams) => [
        <GridActionsCellItem key="edit" icon={<EditIcon sx={{ color: '#38bdf8' }} />} label="Edit" onClick={() => { setEditText(params.row.text || ''); setEditDialog({ open: true, row: params.row }); }} showInMenu={false} />,
        params.row.isHidden
          ? <GridActionsCellItem key="unhide" icon={<VisibilityIcon color="success" />} label="Unhide" onClick={() => handleToggleHide(params.row)} showInMenu={false} />
          : <GridActionsCellItem key="hide" icon={<VisibilityOffIcon color="warning" />} label="Hide" onClick={() => handleToggleHide(params.row)} showInMenu={false} />,
        <GridActionsCellItem key="delete" icon={<DeleteIcon color="error" />} label="Delete" onClick={() => setDeleteDialog({ open: true, reviewId: params.row.id })} showInMenu={false} />,
      ],
    },
  ];

  const hasActiveFilters = minRating || maxRating || dateFrom || dateTo || ipHashFilter || guestOnly;

  return (
    <Box sx={{
      width: '100%',
      background: 'rgba(24,24,27,0.98)',
      borderRadius: 2,
      p: 2,
      mb: 3,
      color: '#f3f4f6',
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      fontSize: 16,
      boxShadow: '0 2px 12px #0002',
    }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load reviews. Please try again.
        </Alert>
      )}

      {/* Primary filter row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          placeholder="Search text, user, title..."
          InputProps={{ sx: { color: '#fff' } }}
          sx={{ minWidth: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="ctype-label" sx={{ color: '#fff' }}>Content Type</InputLabel>
          <Select
            labelId="ctype-label"
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
        <Badge badgeContent={hasActiveFilters ? '!' : 0} color="warning">
          <Button
            size="small"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(f => !f)}
            variant={showFilters ? 'contained' : 'outlined'}
            sx={{ color: showFilters ? '#000' : '#a78bfa', borderColor: '#a78bfa', background: showFilters ? '#a78bfa' : 'transparent', minWidth: 110 }}
          >
            Filters
          </Button>
        </Badge>
        {ipHashFilter && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityOffOutlinedIcon />}
            onClick={() => setHideAllIpDialog(true)}
            sx={{ borderColor: '#f97316', color: '#f97316', '&:hover': { background: '#f9731620' } }}
          >
            Hide all from this IP
          </Button>
        )}
        {selectedIds.ids.size > 0 && (
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setBulkDeleteDialog(true)}
            sx={{ ml: 'auto' }}
          >
            Delete {selectedIds.ids.size} selected
          </Button>
        )}
      </Box>

      {/* Advanced filters panel */}
      {showFilters && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center', background: '#1a1a2e', borderRadius: 1, p: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel sx={{ color: '#9ca3af' }}>Min Rating</InputLabel>
            <Select
              label="Min Rating"
              value={minRating}
              onChange={(e) => { setMinRating(e.target.value as string); setPaginationModel(p => ({ ...p, page: 0 })); }}
              sx={{ color: '#fff' }}
            >
              <MenuItem value="">Any</MenuItem>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel sx={{ color: '#9ca3af' }}>Max Rating</InputLabel>
            <Select
              label="Max Rating"
              value={maxRating}
              onChange={(e) => { setMaxRating(e.target.value as string); setPaginationModel(p => ({ ...p, page: 0 })); }}
              sx={{ color: '#fff' }}
            >
              <MenuItem value="">Any</MenuItem>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="From date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
            InputLabelProps={{ shrink: true, sx: { color: '#9ca3af' } }}
            InputProps={{ sx: { color: '#fff' } }}
            sx={{ minWidth: 145 }}
          />
          <TextField
            size="small"
            type="date"
            label="To date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
            InputLabelProps={{ shrink: true, sx: { color: '#9ca3af' } }}
            InputProps={{ sx: { color: '#fff' } }}
            sx={{ minWidth: 145 }}
          />
          <TextField
            size="small"
            value={ipHashFilter}
            onChange={(e) => { setIpHashFilter(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
            placeholder="Filter by IP hash..."
            InputProps={{ sx: { color: '#fff', fontSize: 12 } }}
            sx={{ minWidth: 220 }}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={guestOnly}
                onChange={(e) => { setGuestOnly(e.target.checked); setPaginationModel(p => ({ ...p, page: 0 })); }}
                sx={{ '& .MuiSwitch-thumb': { background: guestOnly ? '#a78bfa' : '#6b7280' } }}
              />
            }
            label={<span style={{ color: '#9ca3af', fontSize: 13 }}>Guest only</span>}
          />
          {hasActiveFilters && (
            <Button
              size="small"
              onClick={() => {
                setMinRating(''); setMaxRating(''); setDateFrom(''); setDateTo('');
                setIpHashFilter(''); setGuestOnly(false);
                setPaginationModel(p => ({ ...p, page: 0 }));
              }}
              sx={{ color: '#ef4444', fontSize: 12 }}
            >
              Clear filters
            </Button>
          )}
        </Box>
      )}

      <Box sx={{ height: 520 }}>
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
          slots={{ noRowsOverlay: () => (<Box sx={{ p: 2, color: '#9ca3af' }}>No reviews found</Box>) }}
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
            '& .MuiDataGrid-checkboxInput': {
              color: '#a78bfa !important',
            },
          }}
        />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />

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
            This will hide all <strong>visible</strong> reviews from IP hash <code style={{ background: '#1a1a2e', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{ipHashFilter}</code>.
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
            autoFocus
            fullWidth
            multiline
            minRows={4}
            maxRows={10}
            size="small"
            label="Review text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#9ca3af' } }}
            sx={{ mt: 1 }}
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
