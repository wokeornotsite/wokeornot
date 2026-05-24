"use client";
import React from 'react';
import { DataGrid, GridColDef, GridActionsCellItem, GridSortModel } from '@mui/x-data-grid';
import { Box, TextField, Alert, Chip, Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { useUsersWithStats, SortField } from './useUsersWithStats';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import UserActivityDialog from '../moderation/UserActivityDialog';

const ROLE_COLOR: Record<string, string> = { ADMIN: '#a855f7', MODERATOR: '#3b82f6', USER: '#6b7280' };

function accountAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`;
}

function fmtDate(val: any): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const DATAGRID_SX = {
  fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
  fontSize: 14,
  color: '#fff',
  background: '#101014',
  borderRadius: 2,
  boxShadow: '0 2px 12px #0004',
  '& .MuiDataGrid-cell': { color: '#fff', background: '#191927', borderBottom: '1px solid #232336' },
  '& .MuiDataGrid-columnHeaders': { background: '#232336', color: '#fbbf24', fontWeight: 700, borderBottom: '2px solid #fbbf24' },
  '& .MuiDataGrid-columnHeaderTitle': { color: '#fbbf24', fontWeight: 700 },
  '& .MuiDataGrid-row': { transition: 'background 0.2s', '&:hover': { backgroundColor: '#37376b' } },
  '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#1a1a2e' },
  '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#191927' },
  '& .MuiDataGrid-footerContainer': { background: '#232336', color: '#fff' },
  '& .MuiSvgIcon-root, & .MuiButtonBase-root': { color: '#fff !important', opacity: 1 },
  '& .MuiDataGrid-iconButtonContainer': { color: '#fff' },
  '& .MuiDataGrid-actionsCell': { color: '#fff' },
  '& .MuiDataGrid-sortIcon': { color: '#fbbf24 !important' },
};

export default function UserIntelligenceTable() {
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 20 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: 'createdAt', sort: 'desc' }]);
  const [q, setQ] = React.useState('');
  const [activityDialog, setActivityDialog] = React.useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const dq = useDebouncedValue(q, 300);

  const sortField = (sortModel[0]?.field || 'createdAt') as SortField;
  const sortOrder = (sortModel[0]?.sort || 'desc') as 'asc' | 'desc';

  const { rows, total, isLoading, error } = useUsersWithStats({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    sortBy: sortField,
    sortOrder,
    q: dq || undefined,
  });

  const columns: GridColDef[] = [
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.8,
      minWidth: 200,
      sortable: true,
      renderCell: (params: any) => (
        <span style={{ color: '#a78bfa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%' }}>
          {params.value}
        </span>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 130,
      sortable: false,
      renderCell: (params: any) => (
        <span style={{ color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', width: '100%' }}>
          {params.value || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>—</span>}
        </span>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      sortable: true,
      renderCell: (params: any) => {
        const c = ROLE_COLOR[params.value] || '#6b7280';
        return <Chip label={params.value} size="small" sx={{ background: `${c}25`, color: c, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${c}50` }} />;
      },
    },
    {
      field: 'isBanned',
      headerName: 'Status',
      width: 100,
      sortable: false,
      renderCell: (params: any) => {
        if (params.row.isBanned) {
          return (
            <Tooltip title={params.row.banReason || 'No reason given'} arrow>
              <Chip label="Banned" size="small" sx={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', fontWeight: 700, fontSize: '0.72rem' }} />
            </Tooltip>
          );
        }
        if (params.row.warnCount > 0) {
          return <Chip label={`${params.row.warnCount} warn${params.row.warnCount > 1 ? 's' : ''}`} size="small" sx={{ background: '#78350f', color: '#fde68a', border: '1px solid #f59e0b', fontWeight: 700, fontSize: '0.72rem' }} />;
        }
        return <Chip label="Active" size="small" color="success" sx={{ fontSize: '0.72rem' }} />;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 120,
      sortable: true,
      valueFormatter: (value: any) => fmtDate(value),
    },
    {
      field: 'accountAge',
      headerName: 'Age',
      width: 80,
      sortable: false,
      valueGetter: (_v: any, row: any) => row?.createdAt || '',
      renderCell: (params: any) => (
        <Tooltip title={`Member since ${fmtDate(params.row.createdAt)}`} arrow>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>{params.row.createdAt ? accountAge(params.row.createdAt) : '—'}</span>
        </Tooltip>
      ),
    },
    {
      field: 'reviewCount',
      headerName: 'Reviews',
      width: 90,
      sortable: true,
      renderCell: (params: any) => {
        const count = params.row.reviewCount ?? 0;
        const color = count >= 50 ? '#a855f7' : count >= 10 ? '#38bdf8' : '#9ca3af';
        return <span style={{ fontWeight: count > 0 ? 700 : 400, color }}>{count}</span>;
      },
    },
    {
      field: 'avgRating',
      headerName: 'Avg Rating',
      width: 110,
      sortable: true,
      renderCell: (params: any) => {
        const avg = params.row.avgRating;
        if (avg === null || avg === undefined) return <span style={{ color: '#4b5563' }}>—</span>;
        const color = avg >= 8 ? '#ef4444' : avg >= 5 ? '#fbbf24' : '#4ade80';
        return (
          <span style={{ fontWeight: 700, color }}>
            {avg.toFixed(1)} <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 11 }}>/ 10</span>
          </span>
        );
      },
    },
    {
      field: 'firstReview',
      headerName: 'First Review',
      width: 125,
      sortable: false,
      valueFormatter: (value: any) => fmtDate(value),
    },
    {
      field: 'lastReview',
      headerName: 'Last Review',
      width: 125,
      sortable: true,
      renderCell: (params: any) => {
        const val = params.row.lastReview;
        if (!val) return <span style={{ color: '#4b5563' }}>—</span>;
        const daysAgo = Math.floor((Date.now() - new Date(val).getTime()) / 86400000);
        const fresh = daysAgo <= 7;
        return (
          <Tooltip title={fmtDate(val)} arrow>
            <span style={{ color: fresh ? '#4ade80' : '#9ca3af', fontSize: 13 }}>
              {daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`}
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 56,
      getActions: (params: import('@mui/x-data-grid').GridRowParams) => [
        <GridActionsCellItem
          key="activity"
          icon={<InfoIcon sx={{ color: '#38bdf8' }} />}
          label="View Activity"
          onClick={() => setActivityDialog({ open: true, userId: params.row.id })}
          showInMenu={false}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ width: '100%', background: 'rgba(24,24,27,0.98)', borderRadius: 2, p: 2, color: '#f3f4f6' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load users. Please try again.</Alert>}

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}
          placeholder="Search by email or name..."
          InputProps={{ sx: { color: '#fff' } }}
          sx={{ minWidth: 280 }}
        />
      </Box>

      <Box sx={{ height: 620 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={total}
          paginationMode="server"
          sortingMode="server"
          loading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={(model) => { setSortModel(model); setPaginationModel(p => ({ ...p, page: 0 })); }}
          pageSizeOptions={[20, 50, 100]}
          autoHeight={false}
          disableRowSelectionOnClick
          slots={{ noRowsOverlay: () => <Box sx={{ p: 2, color: '#9ca3af' }}>No users found</Box> }}
          sx={DATAGRID_SX}
        />
      </Box>

      <UserActivityDialog
        open={activityDialog.open}
        userId={activityDialog.userId}
        onClose={() => setActivityDialog({ open: false, userId: null })}
      />
    </Box>
  );
}
