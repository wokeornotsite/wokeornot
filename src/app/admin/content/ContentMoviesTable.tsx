"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowSelectionModel } from '@mui/x-data-grid';
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import EditIcon from '@mui/icons-material/Edit';
import { useMovies } from './useMovies';
import Snackbar from '@mui/material/Snackbar';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ContentMoviesTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [q, setQ] = React.useState('');
  const [contentType, setContentType] = React.useState('');
  const dq = useDebouncedValue(q, 300);
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [bulkDeleteDialog, setBulkDeleteDialog] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [editForm, setEditForm] = React.useState<{ title: string; overview: string; releaseDate: string; posterPath: string; backdropPath: string }>({ title: '', overview: '', releaseDate: '', posterPath: '', backdropPath: '' });
  const [editLoading, setEditLoading] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>({ type: 'include', ids: new Set<string>() });
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Initialize from URL
  React.useEffect(() => {
    const qp = new URLSearchParams(searchParams as any);
    const page = parseInt(qp.get('page') || '0', 10);
    const pageSize = parseInt(qp.get('pageSize') || '10', 10);
    setQ(qp.get('q') || '');
    setContentType(qp.get('contentType') || '');
    setPaginationModel({ page: isNaN(page) ? 0 : page, pageSize: isNaN(pageSize) ? 10 : pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to URL
  React.useEffect(() => {
    const qp = new URLSearchParams();
    if (paginationModel.page) qp.set('page', String(paginationModel.page));
    if (paginationModel.pageSize !== 10) qp.set('pageSize', String(paginationModel.pageSize));
    if (dq) qp.set('q', dq);
    if (contentType) qp.set('contentType', contentType);
    router.replace(`?${qp.toString()}`);
  }, [dq, contentType, paginationModel.page, paginationModel.pageSize, router]);

  const { movies, total, isLoading, error, mutate } = useMovies({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    q: dq || undefined,
    contentType: contentType || undefined,
  });

  async function confirmDelete() {
    const row = deleteDialog.row;
    if (!row) return;
    try {
      await fetch('/api/admin/movies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      });
      setSnackbar({ open: true, message: 'Content deleted' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting content' });
    }
    setDeleteDialog({ open: false, row: null });
  }

  function openEdit(row: any) {
    setEditError(null);
    setEditForm({
      title: row.title ?? '',
      overview: row.overview ?? '',
      releaseDate: row.releaseDate ? new Date(row.releaseDate).toISOString().slice(0, 10) : '',
      posterPath: row.posterPath ?? '',
      backdropPath: row.backdropPath ?? '',
    });
    setEditDialog({ open: true, row });
  }

  async function saveEdit() {
    const row = editDialog.row;
    if (!row) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const payload: any = { id: row.id };
      if (editForm.title.trim() !== (row.title ?? '')) payload.title = editForm.title.trim();
      if (editForm.overview !== (row.overview ?? '')) payload.overview = editForm.overview;
      const currentDate = row.releaseDate ? new Date(row.releaseDate).toISOString().slice(0, 10) : '';
      if (editForm.releaseDate !== currentDate) payload.releaseDate = editForm.releaseDate || null;
      if (editForm.posterPath !== (row.posterPath ?? '')) payload.posterPath = editForm.posterPath || null;
      if (editForm.backdropPath !== (row.backdropPath ?? '')) payload.backdropPath = editForm.backdropPath || null;

      if (Object.keys(payload).length === 1) {
        setEditDialog({ open: false, row: null });
        return;
      }

      const res = await fetch('/api/admin/movies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Save failed');
      }
      setSnackbar({ open: true, message: 'Content updated' });
      setEditDialog({ open: false, row: null });
      mutate();
    } catch (e: any) {
      setEditError(e?.message || 'Save failed');
    } finally {
      setEditLoading(false);
    }
  }

  async function confirmBulkDelete() {
    const ids = Array.from(rowSelectionModel.ids || []) as string[];
    if (!ids.length) return;
    try {
      await fetch('/api/admin/movies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      setSnackbar({ open: true, message: `${ids.length} item${ids.length > 1 ? 's' : ''} deleted` });
      setRowSelectionModel({ type: 'include', ids: new Set<string>() });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting content' });
    }
    setBulkDeleteDialog(false);
  }

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 2 },
    { field: 'year', headerName: 'Year', width: 90 },
    { field: 'contentType', headerName: 'Type', width: 110 },
    {
      field: 'wokeScore',
      headerName: 'Woke Score',
      width: 120,
      valueFormatter: (value: any) => value != null ? `${Number(value).toFixed(1)}/10` : '—',
    },
    { field: 'reviewCount', headerName: 'Reviews', width: 100 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon sx={{ color: '#38bdf8' }} />} label="Edit" onClick={() => openEdit(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon color="error" />} label="Delete" onClick={() => setDeleteDialog({ open: true, row: params.row })} />,
      ],
    },
  ];

  const gridSx = {
    fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    fontSize: 16,
    color: '#f3f4f6',
    background: '#18181b',
    borderRadius: 2,
    boxShadow: '0 2px 12px #0002',
    '& .MuiDataGrid-cell': { color: '#f3f4f6', background: '#18181b' },
    '& .MuiDataGrid-columnHeaderTitle': { color: '#a78bfa', fontWeight: 700 },
    '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#232336' },
    '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#18181b' },
    '& .MuiDataGrid-footerContainer': { background: '#232336', color: '#f3f4f6' },
    '& .MuiSvgIcon-root, & .MuiButtonBase-root': { color: '#fff !important', opacity: 1 },
  };

  return (
    <Box sx={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          placeholder="Search title..."
          InputProps={{ sx: { color: '#fff' } }}
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="ctype-movies-label" sx={{ color: '#fff' }}>Type</InputLabel>
          <Select
            labelId="ctype-movies-label"
            label="Type"
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
        {(rowSelectionModel.ids?.size ?? 0) > 0 && (
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setBulkDeleteDialog(true)}
            sx={{ ml: 'auto' }}
          >
            Delete Selected ({rowSelectionModel.ids?.size ?? 0})
          </Button>
        )}
      </Box>
      <DataGrid
        rows={movies}
        columns={columns}
        rowCount={total}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        loading={isLoading}
        checkboxSelection
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={(newModel) => setRowSelectionModel(newModel)}
        disableRowSelectionOnClick={false}
        autoHeight
        sx={gridSx}
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
          background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#232336', padding: 24, borderRadius: 8, color: '#fff', minWidth: 340 }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Delete Content</h2>
            <p>Delete <strong>{deleteDialog.row?.title}</strong>? This will permanently remove all associated reviews and comments.</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteDialog({ open: false, row: null })} style={{ padding: '8px 18px', borderRadius: 6, background: '#a78bfa', color: '#232336', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: '8px 18px', borderRadius: 6, background: '#ef4444', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <Dialog
        open={editDialog.open}
        onClose={() => !editLoading && setEditDialog({ open: false, row: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { background: '#232336', color: '#fff' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#38bdf8' }}>
          Edit Content {editDialog.row ? `— ${editDialog.row.title}` : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Title"
              size="small"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              InputProps={{ sx: { color: '#fff' } }}
              InputLabelProps={{ sx: { color: '#9ca3af' } }}
              fullWidth
            />
            <TextField
              label="Overview"
              size="small"
              value={editForm.overview}
              onChange={(e) => setEditForm((f) => ({ ...f, overview: e.target.value }))}
              InputProps={{ sx: { color: '#fff' } }}
              InputLabelProps={{ sx: { color: '#9ca3af' } }}
              multiline
              minRows={4}
              maxRows={10}
              fullWidth
            />
            <TextField
              label="Release date (YYYY-MM-DD)"
              size="small"
              value={editForm.releaseDate}
              onChange={(e) => setEditForm((f) => ({ ...f, releaseDate: e.target.value }))}
              InputProps={{ sx: { color: '#fff' } }}
              InputLabelProps={{ sx: { color: '#9ca3af' } }}
              placeholder="2024-05-13"
            />
            <TextField
              label="Poster path (TMDB)"
              size="small"
              value={editForm.posterPath}
              onChange={(e) => setEditForm((f) => ({ ...f, posterPath: e.target.value }))}
              InputProps={{ sx: { color: '#fff' } }}
              InputLabelProps={{ sx: { color: '#9ca3af' } }}
              placeholder="/abc123.jpg"
            />
            <TextField
              label="Backdrop path (TMDB)"
              size="small"
              value={editForm.backdropPath}
              onChange={(e) => setEditForm((f) => ({ ...f, backdropPath: e.target.value }))}
              InputProps={{ sx: { color: '#fff' } }}
              InputLabelProps={{ sx: { color: '#9ca3af' } }}
              placeholder="/xyz789.jpg"
            />
            <Box sx={{ color: '#9ca3af', fontSize: 12 }}>
              Woke score is derived from reviews and cannot be edited here.
            </Box>
            {editError && <Box sx={{ color: '#ef4444', fontSize: 13 }}>{editError}</Box>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialog({ open: false, row: null })}
            disabled={editLoading}
            sx={{ color: '#a78bfa' }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveEdit}
            disabled={editLoading || !editForm.title.trim()}
            variant="contained"
            sx={{ background: '#38bdf8', color: '#000', '&:hover': { background: '#22d3ee' } }}
          >
            {editLoading ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      {bulkDeleteDialog && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#232336', padding: 24, borderRadius: 8, color: '#fff', minWidth: 340 }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Delete {rowSelectionModel.ids?.size ?? 0} Items</h2>
            <p>Permanently delete <strong>{rowSelectionModel.ids?.size ?? 0} selected item{(rowSelectionModel.ids?.size ?? 0) > 1 ? 's' : ''}</strong>? All associated reviews and comments will also be removed. This cannot be undone.</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setBulkDeleteDialog(false)} style={{ padding: '8px 18px', borderRadius: 6, background: '#a78bfa', color: '#232336', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmBulkDelete} style={{ padding: '8px 18px', borderRadius: 6, background: '#ef4444', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Delete All</button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}
