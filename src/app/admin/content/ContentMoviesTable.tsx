"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_MOVIE', targetId: row.id, targetType: 'Movie', details: row.title }),
      });
      setSnackbar({ open: true, message: 'Content deleted' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting content' });
    }
    setDeleteDialog({ open: false, row: null });
  }

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 2 },
    { field: 'year', headerName: 'Year', width: 90 },
    { field: 'contentType', headerName: 'Type', width: 110 },
    {
      field: 'wokeScore',
      headerName: 'Woke Score',
      width: 120,
      valueFormatter: (params: any) => params.value != null ? `${Number(params.value).toFixed(1)}/10` : '—',
    },
    { field: 'reviewCount', headerName: 'Reviews', width: 100 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 90,
      getActions: (params) => [
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
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
        disableRowSelectionOnClick
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
    </Box>
  );
}
