'use client';

import React from 'react';
import Link from 'next/link';
import { Box, TextField, Paper, Typography, Chip, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

type SearchResults = {
  users: { id: string; email: string; name: string | null; role: string; isBanned: boolean }[];
  reviews: { id: string; text: string | null; rating: number; isHidden: boolean; contentId: string | null; contentTitle: string | null; user: { email: string } | null; guestName: string | null }[];
  content: { id: string; title: string; contentType: string; reviewCount: number; wokeScore: number }[];
  forumThreads: { id: string; title: string; userId: string | null; createdAt: string }[];
};

const SECTION_COLORS = {
  Users: '#38bdf8',
  Reviews: '#a78bfa',
  Content: '#e879f9',
  Forum: '#fbbf24',
} as const;

export default function AdminSearchBar() {
  const [q, setQ] = React.useState('');
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const dq = useDebouncedValue(q, 300);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  // Close on outside click.
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  React.useEffect(() => {
    if (!dq || dq.length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/search?q=${encodeURIComponent(dq)}`)
      .then((r) => r.json())
      .then((data: SearchResults) => {
        if (cancelled) return;
        setResults(data);
        setOpen(true);
      })
      .catch(() => {
        if (cancelled) return;
        setResults(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dq]);

  const totalHits =
    (results?.users.length ?? 0) +
    (results?.reviews.length ?? 0) +
    (results?.content.length ?? 0) +
    (results?.forumThreads.length ?? 0);

  return (
    <Box ref={wrapperRef} sx={{ position: 'relative', width: '100%', maxWidth: 520 }}>
      <Box sx={{ position: 'relative' }}>
        <SearchIcon sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
        <TextField
          size="small"
          fullWidth
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { if (results) setOpen(true); }}
          placeholder="Search users, reviews, content, forum…"
          InputProps={{ sx: { color: '#fff', pl: 4, background: '#191927', borderRadius: 2 } }}
        />
        {loading && (
          <CircularProgress size={16} sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#38bdf8' }} />
        )}
      </Box>

      {open && results && (
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#101014',
            border: '1px solid #232336',
            borderRadius: 2,
            maxHeight: 480,
            overflowY: 'auto',
            zIndex: 1500,
            color: '#fff',
            p: 1,
          }}
        >
          {totalHits === 0 && (
            <Typography sx={{ p: 2, color: '#9ca3af', fontSize: 14 }}>
              No matches for &ldquo;{dq}&rdquo;
            </Typography>
          )}

          <ResultGroup label="Users" color={SECTION_COLORS.Users}>
            {results.users.map((u) => (
              <ResultRow
                key={`user-${u.id}`}
                href={`/admin/moderation?tab=users&q=${encodeURIComponent(u.email)}`}
                primary={u.email}
                secondary={`${u.name || '—'} · ${u.role}${u.isBanned ? ' · banned' : ''}`}
                onClick={() => setOpen(false)}
              />
            ))}
          </ResultGroup>

          <ResultGroup label="Reviews" color={SECTION_COLORS.Reviews}>
            {results.reviews.map((r) => {
              const author = r.user?.email || r.guestName || 'anonymous';
              const preview = (r.text || '').slice(0, 80) + ((r.text || '').length > 80 ? '…' : '');
              return (
                <ResultRow
                  key={`review-${r.id}`}
                  href={`/admin/moderation?tab=reviews&q=${encodeURIComponent((r.text || '').slice(0, 40))}`}
                  primary={preview || `(rating ${r.rating}/10 — no text)`}
                  secondary={`${author} · ${r.contentTitle || 'unknown content'}${r.isHidden ? ' · hidden' : ''}`}
                  onClick={() => setOpen(false)}
                />
              );
            })}
          </ResultGroup>

          <ResultGroup label="Content" color={SECTION_COLORS.Content}>
            {results.content.map((c) => (
              <ResultRow
                key={`content-${c.id}`}
                href={`/admin/content?q=${encodeURIComponent(c.title)}`}
                primary={c.title}
                secondary={`${c.contentType} · ${c.reviewCount} review${c.reviewCount === 1 ? '' : 's'} · ${Number(c.wokeScore || 0).toFixed(1)}/10`}
                onClick={() => setOpen(false)}
              />
            ))}
          </ResultGroup>

          <ResultGroup label="Forum threads" color={SECTION_COLORS.Forum}>
            {results.forumThreads.map((t) => (
              <ResultRow
                key={`thread-${t.id}`}
                href={`/admin/forum?q=${encodeURIComponent(t.title)}`}
                primary={t.title}
                secondary={new Date(t.createdAt).toLocaleDateString()}
                onClick={() => setOpen(false)}
              />
            ))}
          </ResultGroup>
        </Paper>
      )}
    </Box>
  );
}

function ResultGroup({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  const childArray = React.Children.toArray(children);
  if (childArray.length === 0) return null;
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5 }}>
        <Chip
          label={label}
          size="small"
          sx={{ background: `${color}22`, color, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', height: 18 }}
        />
        <Typography sx={{ fontSize: 11, color: '#6b7280' }}>{childArray.length}</Typography>
      </Box>
      {children}
    </Box>
  );
}

function ResultRow({ href, primary, secondary, onClick }: { href: string; primary: string; secondary: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: 1,
          '&:hover': { background: '#232336' },
          cursor: 'pointer',
        }}
      >
        <Typography sx={{ fontSize: 14, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {primary}
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {secondary}
        </Typography>
      </Box>
    </Link>
  );
}
