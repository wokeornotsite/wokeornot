"use client";

import React from 'react';
import { SnackbarProvider as NotistackProvider } from 'notistack';
import { styled } from '@mui/material/styles';

const StyledSnackbarProvider = styled(NotistackProvider)(({ theme }) => ({
  '& .SnackbarContent-root': {
    backgroundColor: '#232946',
    color: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '0.9rem',
    fontWeight: 500,
    borderRadius: '8px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
  },
  '& .SnackbarItem-variantSuccess .SnackbarContent-root': {
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  '& .SnackbarItem-variantError .SnackbarContent-root': {
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  '& .SnackbarItem-variantWarning .SnackbarContent-root': {
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
  },
  '& .SnackbarItem-variantInfo .SnackbarContent-root': {
    backgroundColor: 'rgba(56, 189, 248, 0.95)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
  },
}));

export default function AdminSnackbarProvider({ children }: { children: React.ReactNode }) {
  return (
    <StyledSnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={4000}
    >
      {children}
    </StyledSnackbarProvider>
  );
}
