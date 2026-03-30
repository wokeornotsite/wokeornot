"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem, GridSortModel } from '@mui/x-data-grid';
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, Alert, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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
  const dq = useDebouncedValue(q, 300);

  // Initialize from URL
  React.useEffect(() => {
    const qp = new URLSearchParams(searchParams as any);
    const page = parseInt(qp.get('page') || '0', 10);
    const pageSize = parseInt(qp.get('pageSize') || '10', 10);
    const q0 = qp.get('q') || '';
    const ct0 = qp.get('contentType') || '';
    const sortBy0 = qp.get('sortBy');
    const sortOrder0 = (qp.get('sortOrder') as 'asc' | 'desc') || undefined;
    setPaginationModel({ page: isNaN(page) ? 0 : page, pageSize: isNaN(pageSize) ? 10 : pageSize });
    setQ(q0);
    setContentType(ct0);
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
    const sf = sortModel[0]?.field;
    const sd = sortModel[0]?.sort;
    if (sf && sd) { qp.set('sortBy', String(sf)); qp.set('sortOrder', String(sd)); }
    const query = qp.toString();
    router.replace(`?${query}`);
  }, [dq, contentType, paginationModel.page, paginationModel.pageSize, sortModel, router]);

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
  });
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; reviewId: string | null }>({ open: false, reviewId: null });

  async function handleToggleHide(row: any) {
    const nextHidden = !row.isHidden;
    try {
      await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isHidden: nextHidden }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextHidden ? 'HIDE_REVIEW' : 'UNHIDE_REVIEW', targetId: row.id, targetType: 'Review' }),
      });
      setSnackbar({ open: true, message: nextHidden ? 'Review hidden' : 'Review unhidden' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error updating review visibility' });
    }
  }

  async function handleDelete(reviewId: string) {
    try {
      await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_REVIEW', targetId: reviewId, targetType: 'Review' }),
      });
      setSnackbar({ open: true, message: 'Review deleted' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting review' });
    }
    setDeleteDialog({ open: false, reviewId: null });
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
      field: 'isHidden',
      headerName: 'Status',
      width: 100,
      renderCell: (params: any) =>
        params.row.isHidden
          ? <Chip label="Hidden" color="error" size="small" />
          : <Chip label="Visible" color="success" size="small" />,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 90,
      getActions: (params: import('@mui/x-data-grid').GridRowParams) => [
        params.row.isHidden
          ? <GridActionsCellItem icon={<VisibilityIcon color="success" />} label="Unhide" onClick={() => handleToggleHide(params.row)} showInMenu={false} />
          : <GridActionsCellItem icon={<VisibilityOffIcon color="warning" />} label="Hide" onClick={() => handleToggleHide(params.row)} showInMenu={false} />,
        <GridActionsCellItem icon={<DeleteIcon color="error" />} label="Delete" onClick={() => setDeleteDialog({ open: true, reviewId: params.row.id })} showInMenu={false} />,
      ],
    },
  ];

  return (
    <Box sx={{
      height: 560,
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
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          placeholder="Search text, user, title..."
          InputProps={{ sx: { color: '#fff' } }}
          sx={{ minWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
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
      </Box>
      <DataGrid
        rows={reviews}
        columns={columns}
        rowCount={total}
        paginationMode="server"
        sortingMode="server"
        loading={isLoading}
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
        }}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
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
    </Box>
  );
}
