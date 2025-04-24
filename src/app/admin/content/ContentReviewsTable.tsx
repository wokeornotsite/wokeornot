import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// TODO: Replace with real API data
const rows = [
  { id: '1', user: 'user1@email.com', content: 'Review text 1', rating: 7 },
  { id: '2', user: 'user2@email.com', content: 'Review text 2', rating: 3 },
];

const columns: GridColDef[] = [
  { field: 'user', headerName: 'User', flex: 1 },
  { field: 'content', headerName: 'Review', flex: 2 },
  { field: 'rating', headerName: 'Rating', width: 100 },
  {
    field: 'actions',
    type: 'actions',
    headerName: 'Actions',
    width: 120,
    getActions: (params) => [
      <GridActionsCellItem icon={<EditIcon color="primary" />} label="Edit" onClick={() => {}} />, // TODO: implement
      <GridActionsCellItem icon={<DeleteIcon color="error" />} label="Delete" onClick={() => {}} />, // TODO: implement
    ],
  },
];

export default function ContentReviewsTable() {
  return (
    <Box sx={{ height: 270, width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 2, mb: 3 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        disableSelectionOnClick
        sx={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#fff' }}
      />
    </Box>
  );
}
