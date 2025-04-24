"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { useReviews } from './useReviews';
import Snackbar from '@mui/material/Snackbar';

export default function ModerationReviewsTable() {
  const { reviews, isLoading, error, mutate } = useReviews();
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });

  async function handleApprove(row: any) {
    try {
      await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, text: row.text, rating: row.rating }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_REVIEW', targetId: row.id, targetType: 'Review', details: row.text }),
      });
      setSnackbar({ open: true, message: 'Review approved' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error approving review' });
    }
  }
  async function handleHide(row: any) {
    setSnackbar({ open: true, message: 'Hide action not implemented' });
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
    // TODO: Use the correct type for params in valueGetter if available
    { field: 'user', headerName: 'User', flex: 1, valueGetter: (params: any) => (params.row && params.row.user && params.row.user.email) ? params.row.user.email : '' },
    { field: 'text', headerName: 'Review', flex: 2 },
    { field: 'rating', headerName: 'Rating', width: 100 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params: import('@mui/x-data-grid').GridRowParams) => [
        <GridActionsCellItem icon={<CheckIcon color="success" />} label="Approve" onClick={() => handleApprove(params.row)} />,
        <GridActionsCellItem icon={<VisibilityOffIcon color="warning" />} label="Hide" onClick={() => handleHide(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon color="error" />} label="Delete" onClick={() => handleDelete(params.row)} />,
      ],
    },
  ];

  return (
    <Box sx={{
      height: 370,
      width: '100%',
      background: '#18181b',
      borderRadius: 2,
      p: 2,
      mb: 3,
      color: '#f3f4f6',
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      fontSize: 16,
      boxShadow: '0 2px 12px #0002',
    }}>
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Box>
  );
}
