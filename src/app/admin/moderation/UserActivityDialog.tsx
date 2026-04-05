"use client";
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Chip, CircularProgress, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ReviewEntry {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  contentTitle: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  admin: { email: string } | null;
}

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isBanned: boolean;
  banReason: string | null;
  warnCount: number;
  createdAt: string;
}

interface ActivityData {
  user: UserDetail;
  reviews: ReviewEntry[];
  auditEntries: AuditEntry[];
}

const ACTION_LABELS: Record<string, string> = {
  BAN_USER: 'Banned',
  UNBAN_USER: 'Unbanned',
  WARN_USER: 'Warned',
  DELETE_USER: 'Deleted',
  PROMOTE_ADMIN: 'Promoted to Admin',
  PROMOTE_MODERATOR: 'Promoted to Moderator',
  DEMOTE_USER: 'Demoted',
  DELETE_REVIEW: 'Review Deleted',
  HIDE_REVIEW: 'Review Hidden',
  UNHIDE_REVIEW: 'Review Unhidden',
};

const ACTION_COLORS: Record<string, string> = {
  BAN_USER: '#ef4444',
  DELETE_USER: '#ef4444',
  DELETE_REVIEW: '#ef4444',
  WARN_USER: '#fbbf24',
  UNBAN_USER: '#22c55e',
  UNHIDE_REVIEW: '#22c55e',
  PROMOTE_ADMIN: '#38bdf8',
  PROMOTE_MODERATOR: '#a78bfa',
  DEMOTE_USER: '#9ca3af',
  HIDE_REVIEW: '#f97316',
};

function getRatingColor(rating: number): string {
  if (rating >= 8) return '#ef4444';
  if (rating >= 5) return '#fbbf24';
  return '#22c55e';
}

export default function UserActivityDialog({
  open,
  userId,
  onClose,
}: {
  open: boolean;
  userId: string | null;
  onClose: () => void;
}) {
  const [data, setData] = React.useState<ActivityData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !userId) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}&include=activity`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(json => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load user activity.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, userId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { background: '#191927', color: '#fff', borderRadius: 2, border: '1px solid #232336' } }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        User Activity
        <Button onClick={onClose} sx={{ color: '#9ca3af', minWidth: 0, p: 0.5 }}>
          <CloseIcon fontSize="small" />
        </Button>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#232336' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#38bdf8' }} />
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ py: 2 }}>{error}</Typography>
        )}
        {data && !loading && (
          <Box>
            {/* User Info */}
            <Box sx={{ mb: 3, p: 2, background: '#232336', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#fbbf24', fontWeight: 700, mb: 1 }}>User Info</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Email</Typography>
                  <Typography sx={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{data.user.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Role</Typography>
                  <Typography sx={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.9rem' }}>{data.user.role}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {data.user.isBanned
                      ? <Chip label={`Banned${data.user.banReason ? ': ' + data.user.banReason : ''}`} size="small" color="error" sx={{ maxWidth: '100%' }} />
                      : <Chip label="Active" size="small" color="success" />
                    }
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Warnings</Typography>
                  <Typography sx={{ color: data.user.warnCount >= 3 ? '#ef4444' : data.user.warnCount === 2 ? '#fbbf24' : '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>
                    {data.user.warnCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Joined</Typography>
                  <Typography sx={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{new Date(data.user.createdAt).toLocaleDateString()}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Reviews */}
            <Typography variant="subtitle1" sx={{ color: '#a78bfa', fontWeight: 700, mb: 1 }}>
              Recent Reviews ({data.reviews.length})
            </Typography>
            {data.reviews.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>No reviews found.</Typography>
            ) : (
              <Box sx={{ mb: 3 }}>
                {data.reviews.map(r => (
                  <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, px: 1, mb: 0.5, borderRadius: 1, background: 'rgba(167,139,250,0.05)', '&:hover': { background: 'rgba(167,139,250,0.1)' } }}>
                    <Chip
                      label={r.rating}
                      size="small"
                      sx={{ background: `${getRatingColor(r.rating)}22`, color: getRatingColor(r.rating), fontWeight: 700, minWidth: 36 }}
                    />
                    <Typography variant="body2" sx={{ color: '#38bdf8', flexShrink: 0, minWidth: 120, fontSize: '0.8rem' }}>
                      {r.contentTitle || '(unknown content)'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: r.text ? 'normal' : 'italic', fontSize: '0.8rem' }}>
                      {r.text || 'No text'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280', flexShrink: 0, fontSize: '0.72rem' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Divider sx={{ borderColor: '#232336', mb: 2 }} />

            {/* Audit Entries */}
            <Typography variant="subtitle1" sx={{ color: '#e879f9', fontWeight: 700, mb: 1 }}>
              Audit History ({data.auditEntries.length})
            </Typography>
            {data.auditEntries.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>No admin actions recorded.</Typography>
            ) : (
              <Box>
                {data.auditEntries.map(e => {
                  const color = ACTION_COLORS[e.action] || '#9ca3af';
                  return (
                    <Box key={e.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, px: 1, mb: 0.5, borderRadius: 1, background: 'rgba(232,121,249,0.04)' }}>
                      <Chip
                        label={ACTION_LABELS[e.action] || e.action}
                        size="small"
                        sx={{ background: `${color}22`, color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${color}44` }}
                      />
                      <Typography variant="body2" sx={{ color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                        {e.details || '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280', flexShrink: 0, fontSize: '0.72rem' }}>
                        {new Date(e.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #232336' }}>
        <Button onClick={onClose} sx={{ color: '#a78bfa' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
