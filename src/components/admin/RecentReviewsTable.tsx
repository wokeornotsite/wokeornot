"use client";

import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, Chip, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { AdminCard } from '@/components/admin/ResponsiveDataView';

interface Review {
  id: string;
  text: string | null;
  rating: number;
  createdAt: Date;
  guestName?: string | null;
  user: {
    name: string | null;
    email: string | null;
  } | null;
  content: {
    title: string;
    contentType: string;
    tmdbId?: number | null;
  } | null;
}

function getContentHref(contentType?: string | null, tmdbId?: number | null): string | null {
  if (!tmdbId) return null;
  switch (contentType) {
    case 'MOVIE':
      return `/movies/${tmdbId}`;
    case 'TV_SHOW':
      return `/tv-shows/${tmdbId}`;
    case 'KIDS':
      return `/kids/${tmdbId}`;
    default:
      return null;
  }
}

interface RecentReviewsTableProps {
  reviews: Review[];
}

export default function RecentReviewsTable({ reviews }: RecentReviewsTableProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  // Using a consistent date format to avoid hydration errors
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    
    // Format hours for 12-hour clock with leading zeros
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = hours < 10 ? '0' + hours : hours;
    
    // Format minutes with leading zeros
    const minutes = d.getMinutes();
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    
    // Return in format: "May 5, 08:08 PM"
    return `${month} ${day}, ${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'MOVIE':
        return 'Movie';
      case 'TV_SHOW':
        return 'TV Show';
      case 'KIDS':
        return 'Kids';
      default:
        return type || 'Unknown';
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'MOVIE':
        return '#e879f9';
      case 'TV_SHOW':
        return '#38bdf8';
      case 'KIDS':
        return '#a78bfa';
      default:
        return '#9ca3af';
    }
  };

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    if (!id) return;
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        enqueueSnackbar('Review deleted successfully', { variant: 'success' });
        router.refresh();
      } else {
        enqueueSnackbar('Failed to delete review', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('An error occurred', { variant: 'error' });
    }
    setDeleteDialog({ open: false, id: null });
  };

  return (
    <>
      {/* Mobile: stacked cards with inline view/delete actions */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.25, p: 1.5 }}>
        {reviews.length > 0 ? (
          reviews.map((review) => {
            const typeColor = getContentTypeColor(review.content?.contentType || '');
            return (
              <AdminCard key={review.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                  <Typography sx={{ fontSize: 13, color: review.text ? '#e2e8f0' : '#9ca3af', fontStyle: review.text ? 'normal' : 'italic', minWidth: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {review.text || 'No text review'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" sx={{ color: '#38bdf8' }} onClick={() => router.push(`/admin/moderation?reviewId=${review.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Review">
                      <IconButton size="small" sx={{ color: '#ef4444' }} onClick={() => setDeleteDialog({ open: true, id: review.id })}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', mt: 0.75 }}>
                  <Typography sx={{ fontSize: 12, color: '#a78bfa' }}>{review.user?.name || review.user?.email || review.guestName || 'Anonymous'}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#6b7280' }}>·</Typography>
                  <Typography sx={{ fontSize: 12, color: '#e2e8f0' }}>{review.content?.title || 'Unknown content'}</Typography>
                  <Chip label={getContentTypeLabel(review.content?.contentType || '')} size="small" sx={{ backgroundColor: `${typeColor}20`, color: typeColor, fontWeight: 500, fontSize: '0.62rem', height: 18, '& .MuiChip-label': { px: '6px' } }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                  <Typography sx={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{review.rating}/10</Typography>
                  <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{formatDate(review.createdAt)}</Typography>
                </Box>
              </AdminCard>
            );
          })
        ) : (
          <Typography sx={{ color: '#9ca3af', textAlign: 'center', py: 3, fontSize: 14 }}>No reviews found</Typography>
        )}
      </Box>

      {/* Desktop: table */}
      <TableContainer component={Paper} sx={{ background: 'transparent', boxShadow: 'none', display: { xs: 'none', md: 'block' } }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ 
              color: '#f3f4f6', 
              fontWeight: 600, 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.9rem',
            }}>
              User
            </TableCell>
            <TableCell sx={{ 
              color: '#f3f4f6', 
              fontWeight: 600, 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.9rem',
            }}>
              Content
            </TableCell>
            <TableCell sx={{ 
              color: '#f3f4f6', 
              fontWeight: 600, 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.9rem',
            }}>
              Rating
            </TableCell>
            <TableCell sx={{ 
              color: '#f3f4f6', 
              fontWeight: 600, 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.9rem',
              width: '30%'
            }}>
              Review
            </TableCell>
            <TableCell sx={{ 
              color: '#f3f4f6', 
              fontWeight: 600, 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.9rem',
            }}>
              Date
            </TableCell>
            <TableCell sx={{ 
              color: '#f3f4f6', 
              fontWeight: 600, 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.9rem',
            }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <TableRow key={review.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ 
                  color: '#e2e8f0', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.9rem',
                }}>
                  {review.user?.email || review.user?.name ? (
                    <Tooltip title={review.user?.email || ''}>
                      <Typography variant="body2" sx={{ color: '#a78bfa' }}>
                        {review.user?.name || review.user?.email}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                      {review.guestName || 'Anonymous'}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.9rem',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {(() => {
                      const href = getContentHref(review.content?.contentType, review.content?.tmdbId);
                      const title = review.content?.title || 'Unknown content';
                      return href ? (
                        <Link
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#38bdf8', textDecoration: 'none' }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: '#38bdf8', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {title}
                          </Typography>
                        </Link>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                          {title}
                        </Typography>
                      );
                    })()}
                    <Chip 
                      label={getContentTypeLabel(review.content?.contentType || '')} 
                      size="small"
                      sx={{ 
                        backgroundColor: `${getContentTypeColor(review.content?.contentType || '')}20`,
                        color: getContentTypeColor(review.content?.contentType || ''),
                        fontWeight: 500,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ 
                  color: '#f59e0b', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}>
                  {review.rating}/10
                </TableCell>
                <TableCell sx={{ 
                  color: '#e2e8f0', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.9rem',
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#e2e8f0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {review.text || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No text review</span>}
                  </Typography>
                </TableCell>
                <TableCell sx={{ 
                  color: '#9ca3af', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.85rem',
                }}>
                  {formatDate(review.createdAt)}
                </TableCell>
                <TableCell sx={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        sx={{ color: '#38bdf8' }}
                        onClick={() => router.push(`/admin/moderation?reviewId=${review.id}`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Review">
                      <IconButton
                        size="small"
                        sx={{ color: '#ef4444' }}
                        onClick={() => setDeleteDialog({ open: true, id: review.id })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} sx={{ color: '#9ca3af', textAlign: 'center', py: 4 }}>
                No reviews found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        PaperProps={{ sx: { background: '#232336', color: '#fff', minWidth: 340 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>Delete Review</DialogTitle>
        <DialogContent>
          <Typography sx={{ m: 0 }}>Delete this review? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ color: '#a78bfa' }}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
