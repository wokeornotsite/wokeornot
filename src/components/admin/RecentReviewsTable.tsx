"use client";

import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Box, Chip, Tooltip, IconButton 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

interface Review {
  id: string;
  text: string | null;
  rating: number;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  } | null;
  content: {
    title: string;
    contentType: string;
  };
}

interface RecentReviewsTableProps {
  reviews: Review[];
}

export default function RecentReviewsTable({ reviews }: RecentReviewsTableProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

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
        return type;
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

  const handleDelete = async (id: string) => {
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
  };

  return (
    <TableContainer component={Paper} sx={{ background: 'transparent', boxShadow: 'none' }}>
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
                  {review.user ? (
                    <Tooltip title={review.user.email || ''}>
                      <Typography variant="body2" sx={{ color: '#a78bfa' }}>
                        {review.user.name || review.user.email || 'Anonymous'}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                      Anonymous
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.9rem',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                      {review.content.title}
                    </Typography>
                    <Chip 
                      label={getContentTypeLabel(review.content.contentType)} 
                      size="small"
                      sx={{ 
                        backgroundColor: `${getContentTypeColor(review.content.contentType)}20`,
                        color: getContentTypeColor(review.content.contentType),
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
                        onClick={() => handleDelete(review.id)}
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
  );
}
