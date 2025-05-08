"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useSnackbar } from 'notistack';

import { useReviews } from './useReviews';

export default function ModerationReviewsTable() {
  const { reviews, isLoading, error, mutate } = useReviews();
  const { enqueueSnackbar } = useSnackbar();
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; reviewId: string | null }>({ open: false, reviewId: null });
  const [hideLoading, setHideLoading] = React.useState<string | null>(null);

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
      enqueueSnackbar('Review approved', { variant: 'success' });
      mutate();
    } catch {
      enqueueSnackbar('Error approving review', { variant: 'error' });
    }
  }

  async function handleHide(row: any) {
    setHideLoading(row.id);
    try {
      await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, hidden: true }),
      });
      await fetch('/api/admin/auditlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'HIDE_REVIEW', targetId: row.id, targetType: 'Review', details: row.text }),
      });
      enqueueSnackbar('Review hidden', { variant: 'info' });
      mutate();
    } catch {
      enqueueSnackbar('Error hiding review', { variant: 'error' });
    }
    setHideLoading(null);
  }

  async function handleDelete(reviewId: string) {
    try {
      await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId }),
      });
      enqueueSnackbar('Review deleted', { variant: 'success' });
      mutate();
    } catch {
      enqueueSnackbar('Error deleting review', { variant: 'error' });
    }
    setDeleteDialog({ open: false, reviewId: null });
  }
  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: 'User',
      flex: 1,
      minWidth: 140,
      valueGetter: (params: any) => {
        if (!params || !params.row) return 'Guest';
        return params.row.user?.email || params.row.user?.name || 'Guest';
      },
      renderCell: (params: any) => (
        <Tooltip title={params.value || ''} arrow>
          <span>{params.value}</span>
        </Tooltip>
      )
    },
    {
      field: 'content',
      headerName: 'Content',
      flex: 1,
      minWidth: 140,
      valueGetter: (params: any) => {
        if (!params || !params.row) return '';
        return params.row.content?.title || '';
      },
      renderCell: (params: any) => (
        <Tooltip title={params.value || ''} arrow>
          <span>{params.value}</span>
        </Tooltip>
      )
    },
    {
      field: 'text',
      headerName: 'Review',
      flex: 2,
      minWidth: 200,
      valueGetter: (params: any) => {
        if (!params || !params.row) return '(No review text)';
        return params.row.text || '(No review text)';
      },
      renderCell: (params: any) => (
        <Tooltip title={params.value} arrow>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 320 }}>{params.value}</span>
        </Tooltip>
      )
    },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 100,
      valueGetter: (params: any) => {
        if (!params || !params.row) return '-';
        return params.row.rating ?? '-';
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 140,
      valueGetter: (params: any) => {
        if (!params || !params.row) return '';
        return params.row.createdAt ? new Date(params.row.createdAt).toLocaleString() : '';
      },
      renderCell: (params: any) => (
        <Tooltip title={params.value || ''} arrow>
          <span>{params.value}</span>
        </Tooltip>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 170,
      getActions: (params: import('@mui/x-data-grid').GridRowParams) => [
        <GridActionsCellItem 
          key="approve" 
          icon={<CheckIcon color="success" />} 
          label="Approve" 
          onClick={() => handleApprove(params.row)} 
        />,
        <GridActionsCellItem 
          key="hide" 
          icon={hideLoading === params.row.id ? <CircularProgress size={20} color="warning" /> : <VisibilityOffIcon color="warning" />} 
          label="Hide" 
          onClick={() => handleHide(params.row)} 
          disabled={!!hideLoading} 
        />,
        <GridActionsCellItem 
          key="delete" 
          icon={<DeleteIcon color="error" />} 
          label="Delete" 
          onClick={() => setDeleteDialog({ open: true, reviewId: params.row.id })} 
        />,
      ],
    },
  ];

  return (
    <Box sx={{
      minHeight: 370,
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
        <Typography color="error" sx={{ mb: 2 }}>Failed to load reviews. Please try again.</Typography>
      )}
      {isLoading ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={200}>
          <CircularProgress color="info" />
        </Box>
      ) : reviews.length === 0 ? (
        <Typography sx={{ color: '#a78bfa', textAlign: 'center', py: 4 }}>No reviews to moderate 🎉</Typography>
      ) : (
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
      )}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, reviewId: null })}>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444', background: '#232336' }}>Delete Review</DialogTitle>
        <DialogContent sx={{ background: '#232336' }}>
          <DialogContentText sx={{ color: '#fff' }}>
            Are you sure you want to permanently delete this review? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ background: '#232336' }}>
          <Button onClick={() => setDeleteDialog({ open: false, reviewId: null })} sx={{ color: '#a78bfa', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteDialog.reviewId!)} sx={{ color: '#fff', background: '#ef4444', fontWeight: 600, '&:hover': { background: '#dc2626' } }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

