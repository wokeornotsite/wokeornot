'use client';

import React from 'react';
import {
  Box, Stack, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  Button, Typography, CircularProgress, Divider,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export type PaginationModel = { page: number; pageSize: number };

export type CardAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
};

/**
 * Responsive wrapper for admin list views.
 *
 * Desktop (>= md): renders the existing `<DataGrid>` passed via `desktop` — unchanged.
 * Mobile (< md): renders a stacked card list built from `rows` + `renderCard`, with a
 * compact pager wired to the same server pagination model when provided.
 *
 * This keeps the desktop experience identical (lowest regression risk) while making
 * every list usable on a phone through a single shared component.
 */
export default function ResponsiveDataView({
  desktop,
  rows,
  renderCard,
  loading = false,
  emptyMessage = 'No results',
  paginationModel,
  onPaginationModelChange,
  rowCount,
}: {
  desktop: React.ReactNode;
  rows: any[];
  renderCard: (row: any) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  paginationModel?: PaginationModel;
  onPaginationModelChange?: (m: PaginationModel) => void;
  rowCount?: number;
}) {
  return (
    <>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>{desktop}</Box>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <MobileCardList
          rows={rows}
          renderCard={renderCard}
          loading={loading}
          emptyMessage={emptyMessage}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          rowCount={rowCount}
        />
      </Box>
    </>
  );
}

function MobileCardList({
  rows, renderCard, loading, emptyMessage, paginationModel, onPaginationModelChange, rowCount,
}: {
  rows: any[];
  renderCard: (row: any) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  paginationModel?: PaginationModel;
  onPaginationModelChange?: (m: PaginationModel) => void;
  rowCount?: number;
}) {
  if (loading && rows.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress sx={{ color: '#38bdf8' }} />
      </Box>
    );
  }

  if (rows.length === 0) {
    return <Box sx={{ p: 3, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>{emptyMessage}</Box>;
  }

  const canPage =
    paginationModel != null && onPaginationModelChange != null && typeof rowCount === 'number';

  return (
    <Stack spacing={1.25} sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
      {rows.map((row) => (
        <React.Fragment key={row.id ?? JSON.stringify(row)}>{renderCard(row)}</React.Fragment>
      ))}
      {canPage && (
        <MobilePager
          paginationModel={paginationModel!}
          onPaginationModelChange={onPaginationModelChange!}
          rowCount={rowCount!}
        />
      )}
    </Stack>
  );
}

function MobilePager({
  paginationModel, onPaginationModelChange, rowCount,
}: {
  paginationModel: PaginationModel;
  onPaginationModelChange: (m: PaginationModel) => void;
  rowCount: number;
}) {
  const { page, pageSize } = paginationModel;
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, rowCount);
  const canPrev = page > 0;
  const canNext = end < rowCount;

  if (!canPrev && !canNext) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1 }}>
      <Button
        size="small"
        disabled={!canPrev}
        onClick={() => onPaginationModelChange({ ...paginationModel, page: page - 1 })}
        sx={{ color: '#38bdf8', textTransform: 'none', minHeight: 44 }}
      >
        ← Prev
      </Button>
      <Typography sx={{ fontSize: 13, color: '#9ca3af' }}>
        {start}–{end} of {rowCount}
      </Typography>
      <Button
        size="small"
        disabled={!canNext}
        onClick={() => onPaginationModelChange({ ...paginationModel, page: page + 1 })}
        sx={{ color: '#38bdf8', textTransform: 'none', minHeight: 44 }}
      >
        Next →
      </Button>
    </Box>
  );
}

/** Consistent card container for mobile list rows. */
export function AdminCard({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <Box
      sx={{
        background: '#191927',
        border: '1px solid #232336',
        borderLeft: accent ? `3px solid ${accent}` : '1px solid #232336',
        borderRadius: 2,
        p: 1.5,
        color: '#e2e8f0',
      }}
    >
      {children}
    </Box>
  );
}

/** Overflow (⋮) menu of row actions for a mobile card. */
export function CardActionsMenu({ actions }: { actions: CardAction[] }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const visible = actions.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <>
      <IconButton
        aria-label="Row actions"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ color: '#9ca3af', width: 44, height: 44 }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { background: '#232336', color: '#fff', border: '1px solid #37376b' } } }}
      >
        {visible.map((a, i) => [
          i > 0 && a.color === '#ef4444' && visible[i - 1].color !== '#ef4444' ? (
            <Divider key={`d-${i}`} sx={{ borderColor: '#37376b' }} />
          ) : null,
          <MenuItem
            key={a.label}
            disabled={a.disabled}
            onClick={() => { setAnchorEl(null); a.onClick(); }}
            sx={{ fontSize: 14, minHeight: 44, color: a.color || '#e2e8f0' }}
          >
            {a.icon && <ListItemIcon sx={{ color: a.color || '#9ca3af', minWidth: 34 }}>{a.icon}</ListItemIcon>}
            <ListItemText primaryTypographyProps={{ fontSize: 14 }}>{a.label}</ListItemText>
          </MenuItem>,
        ])}
      </Menu>
    </>
  );
}

/** A label / value line for use inside AdminCard. */
export function CardRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, fontSize: 13, py: 0.25 }}>
      <Typography component="span" sx={{ color: '#6b7280', fontSize: 12, flexShrink: 0 }}>{label}</Typography>
      <Box sx={{ color: '#cbd5e1', fontSize: 13, textAlign: 'right', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {children}
      </Box>
    </Box>
  );
}
