"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';

export default function ContentMoviesTable({ movies, isLoading, mutate }: { 
  movies: any[]; 
  isLoading: boolean;
  mutate: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; movieId: string | null }>({ open: false, movieId: null });
  const [search, setSearch] = React.useState('');
  
  // Filter movies based on search term
  const filteredMovies = React.useMemo(() => {
    if (!movies || !Array.isArray(movies)) return [];
    
    return movies.filter((movie: any) => {
      if (!movie) return false;
      const title = movie.title || '';
      return title.toLowerCase().includes(search.toLowerCase());
    });
  }, [movies, search]);

  async function handleEdit(row: any) {
    enqueueSnackbar('Edit action not implemented', { variant: 'info' });
  }

  async function handleDelete(movieId: string) {
    try {
      await fetch('/api/admin/movies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: movieId }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_MOVIE', targetId: movieId, targetType: 'Movie' }),
      });
      enqueueSnackbar('Movie deleted', { variant: 'success' });
      mutate();
    } catch (error) {
      enqueueSnackbar('Error deleting movie', { variant: 'error' });
    }
    setDeleteDialog({ open: false, movieId: null });
  }

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 2 },
    { field: 'year', headerName: 'Year', width: 110 },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      valueGetter: (params: any) => {
        if (!params || !params.row) return '';
        return params.row.createdAt ? new Date(params.row.createdAt).toLocaleString() : '';
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 130,
      getActions: (params: any) => [
        <GridActionsCellItem 
          key="edit" 
          icon={<EditIcon color="primary" />} 
          label="Edit" 
          onClick={() => handleEdit(params.row)} 
        />,
        <GridActionsCellItem 
          key="delete" 
          icon={<DeleteIcon color="error" />} 
          label="Delete" 
          onClick={() => setDeleteDialog({ open: true, movieId: params.row.id })} 
        />,
      ],
    },
  ];

  return (
    <Box sx={{
      height: 370,
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
      <input
        type="text"
        placeholder="Search by title..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12, padding: 6, borderRadius: 4, border: '1px solid #333', width: 220 }}
      />
      <DataGrid
        rows={filteredMovies}
        columns={columns}
        pageSizeOptions={[5]}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        loading={isLoading}
        getRowId={(row) => row.id}
        sx={{
          border: 'none',
          color: '#ffffff',
          '.MuiDataGrid-cell': { 
            color: '#ffffff', 
            backgroundColor: 'rgba(30,30,35,0.9)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.95rem',
            padding: '8px 16px'
          },
          '.MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(50,50,60,0.8)'
          },
          '.MuiDataGrid-columnHeaders': { 
            background: '#18181b', 
            color: '#ffe347', 
            fontWeight: 700,
            borderBottom: '2px solid #ffe347'
          },
          '.MuiDataGrid-footerContainer': { 
            background: '#18181b',
            color: '#ffffff'
          },
          '.MuiTablePagination-root': {
            color: '#ffffff'
          },
          '.MuiSvgIcon-root': {
            color: '#ffe347'
          }
        }}
        slots={{
          noRowsOverlay: () => (
            <Box sx={{ p: 3, color: '#999', textAlign: 'center' }}>No movies found.</Box>
          ),
        }}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, movieId: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this movie? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, movieId: null })}>Cancel</Button>
          <Button onClick={() => deleteDialog.movieId && handleDelete(deleteDialog.movieId)} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
