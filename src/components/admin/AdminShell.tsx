'use client';

import React from 'react';
import { Box, IconButton, CircularProgress } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AdminSidebar from '@/app/admin/AdminSidebar';
import AdminSearchBar from '@/components/admin/AdminSearchBar';
import AdminSnackbarProvider from '@/components/admin/AdminSnackbarProvider';
import styles from '@/app/admin/admin.module.css';

/**
 * Client shell that owns the admin chrome: the responsive sidebar/drawer, the
 * mobile top bar (hamburger + search), and the main content area. Desktop layout
 * is unchanged from the previous server layout; the top bar is mobile-only (CSS).
 */
export default function AdminShell({ isAdmin, children }: { isAdmin: boolean; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className={styles.adminRoot}>
      <AdminSidebar isAdmin={isAdmin} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={styles.adminContent}>
        {/* Mobile-only top bar — hamburger + search. Hidden on desktop via CSS. */}
        <header className={styles.adminTopBar}>
          <IconButton
            aria-label="Open admin menu"
            onClick={() => setMobileOpen(true)}
            sx={{ color: '#38bdf8', flexShrink: 0, '&:hover': { background: 'rgba(56,189,248,0.1)' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AdminSearchBar />
          </Box>
        </header>

        <AdminSnackbarProvider>
          <main className={styles.adminMain}>
            {/* Desktop-only search, pinned top-right (mobile uses the top bar above). */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', mb: 2 }}>
              <AdminSearchBar />
            </Box>
            <React.Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                  <CircularProgress sx={{ color: '#38bdf8' }} />
                </Box>
              }
            >
              {children}
            </React.Suspense>
          </main>
        </AdminSnackbarProvider>
      </div>
    </div>
  );
}
