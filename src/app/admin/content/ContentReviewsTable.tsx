"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useReviews } from '../moderation/useReviews';
import Snackbar from '@mui/material/Snackbar';

export default function ContentReviewsTable() {
  const { reviews, isLoading, error, mutate } = useReviews();
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });

  async function handleEdit(row: any) {
    // Implement edit logic (open dialog, send PATCH, etc.)
    setSnackbar({ open: true, message: 'Edit action not implemented' });
  }
  async function handleDelete(row: any) {
    try {
      await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_REVIEW', targetId: row.id, targetType: 'Review', details: row.text }),
      });
      setSnackbar({ open: true, message: 'Review deleted' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting review' });
    }
  }

  const columns: GridColDef[] = [
    { field: 'user', headerName: 'User', flex: 1, valueGetter: (params: any) => params.row?.user?.email || '' },
    { field: 'text', headerName: 'Review', flex: 2 },
    { field: 'rating', headerName: 'Rating', width: 100 },
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
        rows={reviews}
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
