import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// TODO: Replace with real API data
const rows = [
  { id: '1', title: 'Movie 1', type: 'Movie', featured: true },
  { id: '2', title: 'Show 1', type: 'Show', featured: false },
];

const columns: GridColDef[] = [
  { field: 'title', headerName: 'Title', flex: 2 },
  { field: 'type', headerName: 'Type', width: 120 },
  { field: 'featured', headerName: 'Featured', width: 120, type: 'boolean' },
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

export default function ContentMoviesTable() {
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
