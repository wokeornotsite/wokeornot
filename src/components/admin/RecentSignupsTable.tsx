"use client";

import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Box,
} from '@mui/material';

interface SignupUser {
  id: string;
  email: string | null;
  role: string;
  createdAt: string;
}

interface RecentSignupsTableProps {
  users: SignupUser[];
}

const roleColors: Record<string, string> = {
  ADMIN: '#ef4444',
  MODERATOR: '#a78bfa',
  USER: '#38bdf8',
};

export default function RecentSignupsTable({ users }: RecentSignupsTableProps) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  return (
    <TableContainer component={Paper} sx={{ background: 'transparent', boxShadow: 'none' }}>
      <Table sx={{ minWidth: 400 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: '#f3f4f6', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
              Email
            </TableCell>
            <TableCell sx={{ color: '#f3f4f6', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
              Role
            </TableCell>
            <TableCell sx={{ color: '#f3f4f6', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
              Joined
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                  {user.email || '—'}
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Chip
                    label={user.role}
                    size="small"
                    sx={{
                      backgroundColor: `${roleColors[user.role] || '#9ca3af'}20`,
                      color: roleColors[user.role] || '#9ca3af',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                  {formatDate(user.createdAt)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} sx={{ color: '#9ca3af', textAlign: 'center', py: 4 }}>
                No recent signups
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
