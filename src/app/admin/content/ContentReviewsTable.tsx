"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useReviews } from '../moderation/useReviews';
import { useSnackbar } from 'notistack';

export default function ContentReviewsTable() {
  const { reviews, isLoading, error, mutate } = useReviews();
  const { enqueueSnackbar } = useSnackbar();
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; reviewId: string | null }>({ open: false, reviewId: null });
  const [search, setSearch] = React.useState('');
  
  // Debug: Log reviews data structure to understand the format
  React.useEffect(() => {
    console.log('Reviews data structure:', reviews);
    if (reviews && reviews.length > 0) {
      console.log('First review example:', reviews[0]);
    }
  }, [reviews]);
  
  // Filter reviews based on search term
  const filteredReviews = React.useMemo(() => {
    if (!reviews || !Array.isArray(reviews)) {
      console.log('Reviews is not an array:', reviews);
      return [];
    }
    
    return reviews.filter((review: any) => {
      if (!review) return false;
      const user = review.user?.email || review.user?.name || 'Guest';
      const text = review.text || '';
      const searchLower = search.toLowerCase();
      return user.toLowerCase().includes(searchLower) || text.toLowerCase().includes(searchLower);
    });
  }, [reviews, search]);

  async function handleEdit(row: any) {
    enqueueSnackbar('Edit action not implemented', { variant: 'info' });
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
      valueGetter: (params: any) => {
        if (!params || !params.row) return '';
        return params.row.user?.email || params.row.user?.name || 'Guest';
      }
    },
    {
      field: 'content',
      headerName: 'Content',
      flex: 1,
      valueGetter: (params: any) => {
        if (!params || !params.row) return '';
        return params.row.content?.title || '';
      }
    },
    {
      field: 'text',
      headerName: 'Review',
      flex: 2,
      valueGetter: (params: any) => {
        if (!params || !params.row) return '';
        return params.row.text || '(No review text)';
      }
    },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 100,
      valueGetter: (params: any) => {
        if (!params || !params.row) return '-';
        return params.row.rating ?? '-';
      }
    },
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
        <GridActionsCellItem key="edit" icon={<EditIcon color="primary" />} label="Edit" onClick={() => handleEdit(params.row)} />,
        <GridActionsCellItem key="delete" icon={<DeleteIcon color="error" />} label="Delete" onClick={() => setDeleteDialog({ open: true, reviewId: params.row.id })} />,
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
        placeholder="Search by user or review..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12, padding: 6, borderRadius: 4, border: '1px solid #333', width: 240 }}
      />
      <DataGrid
        rows={filteredReviews}
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
            <Box sx={{ p: 3, color: '#999', textAlign: 'center' }}>No reviews found.</Box>
          ),
        }}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, reviewId: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this review? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, reviewId: null })}>Cancel</Button>
          <Button onClick={() => deleteDialog.reviewId && handleDelete(deleteDialog.reviewId)} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
