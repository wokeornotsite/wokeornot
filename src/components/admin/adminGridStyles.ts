// Shared admin DataGrid styling + color tokens.
// Previously this SX object was copy-pasted into every admin table; centralize it
// here so all grids stay visually consistent.

export const ADMIN_GRID_SX = {
  fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
  fontSize: 14,
  color: '#fff',
  background: '#101014',
  borderRadius: 2,
  boxShadow: '0 2px 12px #0004',
  '& .MuiDataGrid-cell': { color: '#fff', background: '#191927', borderBottom: '1px solid #232336' },
  '& .MuiDataGrid-columnHeaders': { background: '#232336', color: '#fbbf24', fontWeight: 700, borderBottom: '2px solid #fbbf24' },
  '& .MuiDataGrid-columnHeaderTitle': { color: '#fbbf24', fontWeight: 700 },
  '& .MuiDataGrid-row': { transition: 'background 0.15s', '&:hover': { backgroundColor: '#37376b', color: '#fff' } },
  '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#1a1a2e' },
  '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#191927' },
  '& .MuiDataGrid-footerContainer': { background: '#232336', color: '#fff' },
  '& .MuiSvgIcon-root, & .MuiButtonBase-root': { color: '#fff !important', opacity: 1 },
  '& .MuiDataGrid-iconButtonContainer': { color: '#fff' },
  '& .MuiDataGrid-actionsCell': { color: '#fff' },
  '& .MuiDataGrid-sortIcon': { color: '#fbbf24 !important' },
  '& .MuiDataGrid-checkboxInput': { color: '#a78bfa !important' },
} as const;

export const ROLE_COLOR: Record<string, string> = {
  ADMIN: '#a855f7',
  MODERATOR: '#3b82f6',
  USER: '#6b7280',
};
