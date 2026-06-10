"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box, TextField, Alert, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Snackbar from '@mui/material/Snackbar';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useForumThreads } from './useForumThreads';
import { useRouter, useSearchParams } from 'next/navigation';
import ResponsiveDataView, { AdminCard, CardActionsMenu } from '@/components/admin/ResponsiveDataView';
import { ADMIN_GRID_SX } from '@/components/admin/adminGridStyles';

export default function ForumThreadsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [q, setQ] = React.useState('');
  const dq = useDebouncedValue(q, 300);
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Initialize from URL
  React.useEffect(() => {
    const qp = new URLSearchParams(searchParams as any);
    const page = parseInt(qp.get('page') || '0', 10);
    const pageSize = parseInt(qp.get('pageSize') || '10', 10);
    setQ(qp.get('q') || '');
    setPaginationModel({ page: isNaN(page) ? 0 : page, pageSize: isNaN(pageSize) ? 10 : pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to URL
  React.useEffect(() => {
    const qp = new URLSearchParams();
    if (paginationModel.page) qp.set('page', String(paginationModel.page));
    if (paginationModel.pageSize !== 10) qp.set('pageSize', String(paginationModel.pageSize));
    if (dq) qp.set('q', dq);
    router.replace(`?${qp.toString()}`);
  }, [dq, paginationModel.page, paginationModel.pageSize, router]);

  const { rows, total, isLoading, error, mutate } = useForumThreads({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    q: dq || undefined,
  });

  async function confirmDelete() {
    const row = deleteDialog.row;
    if (!row) return;
    try {
      await fetch('/api/admin/forum', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      });
      setSnackbar({ open: true, message: 'Thread deleted' });
      mutate();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting thread' });
    }
    setDeleteDialog({ open: false, row: null });
  }

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 2 },
    {
      field: 'user',
      headerName: 'Author',
      flex: 1,
      valueGetter: (params: any) => params?.row?.user?.email || params?.row?.userId || '—',
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 180,
      type: 'dateTime',
      valueGetter: (params: any) => params?.row?.createdAt ? new Date(params.row.createdAt) : null,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 90,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<DeleteIcon color="error" />}
          label="Delete"
          onClick={() => setDeleteDialog({ open: true, row: params.row })}
        />,
      ],
    },
  ];

  const renderCard = (row: any) => (
    <AdminCard>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: 14, wordBreak: 'break-word' }}>
            {row.title || '(untitled)'}
          </Typography>
          <Typography sx={{ color: '#9ca3af', fontSize: 12, mt: 0.25 }}>
            {row.user?.email || row.userId || '—'}
          </Typography>
          <Typography sx={{ color: '#6b7280', fontSize: 12 }}>
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : ''}
          </Typography>
        </Box>
        <CardActionsMenu
          actions={[
            { label: 'Delete', icon: <DeleteIcon fontSize="small" />, color: '#ef4444', onClick: () => setDeleteDialog({ open: true, row }) },
          ]}
        />
      </Box>
    </AdminCard>
  );

  return (
    <Box sx={{ width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, mb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load forum threads. Please try again.
        </Alert>
      )}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          placeholder="Search title or content..."
          InputProps={{ sx: { color: '#fff' } }}
          sx={{ minWidth: 300, maxWidth: '100%' }}
        />
      </Box>
      <ResponsiveDataView
        rows={rows}
        loading={isLoading}
        renderCard={renderCard}
        emptyMessage="No forum threads found"
        rowCount={total}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        desktop={
        <Box sx={{ height: 540 }}>
        <DataGrid
        rows={rows}
        columns={columns}
        rowCount={total}
        paginationMode="server"
        loading={isLoading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        autoHeight={false}
        disableRowSelectionOnClick
        slots={{ noRowsOverlay: () => <Box sx={{ p: 2, color: '#9ca3af' }}>No forum threads found</Box> }}
        sx={{ ...ADMIN_GRID_SX, fontSize: 16 }}
      />
        </Box>
        }
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
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Delete Forum Thread</h2>
            <p>Delete <strong>{deleteDialog.row?.title}</strong>? This action cannot be undone.</p>
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
