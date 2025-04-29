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
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; reviewId: string | null }>({ open: false, reviewId: null });

  async function handleDelete(reviewId: string) {
    try {
      await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId }),
      });
      setSnackbar({ open: true, message: 'Review deleted' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting review' });
    }
    setDeleteDialog({ open: false, reviewId: null });
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
        <GridActionsCellItem icon={<DeleteIcon color="error" />} label="Delete" onClick={() => setDeleteDialog({ open: true, reviewId: params.row.id })} />,
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
      {deleteDialog.open && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#232336', padding: 24, borderRadius: 8, color: '#fff', minWidth: 320 }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Delete Review</h2>
            <p>Are you sure you want to permanently delete this review? This action cannot be undone.</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteDialog({ open: false, reviewId: null })} style={{ padding: '8px 18px', borderRadius: 6, background: '#a78bfa', color: '#232336', fontWeight: 600, border: 'none' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteDialog.reviewId!)} style={{ padding: '8px 18px', borderRadius: 6, background: '#ef4444', color: '#fff', fontWeight: 600, border: 'none' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}

