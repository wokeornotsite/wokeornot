"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMovies } from './useMovies';
import Snackbar from '@mui/material/Snackbar';

export default function ContentMoviesTable() {
  const { movies, isLoading, error, mutate } = useMovies();
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });

  async function handleEdit(row: any) {
    // Implement edit logic (open dialog, send PATCH, etc.)
    setSnackbar({ open: true, message: 'Edit action not implemented' });
  }
  async function handleDelete(row: any) {
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
      setSnackbar({ open: true, message: 'Movie deleted' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting movie' });
    }
  }

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 2 },
    { field: 'year', headerName: 'Year', width: 110 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 130,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon color="primary" />} label="Edit" onClick={() => handleEdit(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon color="error" />} label="Delete" onClick={() => handleDelete(params.row)} />,
      ],
    },
  ];

  return (
    <Box sx={{ height: 270, width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 2, mb: 3 }}>
      <DataGrid
        rows={movies}
        columns={columns}
        pageSizeOptions={[5]}
        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        loading={isLoading}
        disableRowSelectionOnClick
        sx={{
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
        }}
      />
    </Box>
  );
}
