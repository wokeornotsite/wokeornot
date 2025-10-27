'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './admin.module.css';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ReviewsIcon from '@mui/icons-material/RateReview';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import BarChartIcon from '@mui/icons-material/BarChart';
import BuildIcon from '@mui/icons-material/Build';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { Button, Drawer, IconButton, useMediaQuery, useTheme } from '@mui/material';

const navLinks = [
  { href: '/admin', icon: <DashboardIcon />, label: 'Dashboard', exact: true },
  { href: '/admin/moderation', icon: <ReviewsIcon />, label: 'Moderation', exact: false },
  { href: '/admin/users', icon: <PeopleIcon />, label: 'Users', exact: false },
  { href: '/admin/content', icon: <ManageSearchIcon />, label: 'Content', exact: false },
  { href: '/admin/analytics', icon: <BarChartIcon />, label: 'Analytics', exact: false },
  { href: '/admin/maintenance', icon: <BuildIcon />, label: 'Maintenance', exact: false },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const sidebarContent = (
    <>
      <div className={styles.adminLogo}>WokeOrNot Admin</div>
      <nav style={{ flex: 1 }}>
        <ul className={styles.adminNavList}>
          {navLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  className={`${styles.adminNavLink} ${active ? styles.adminNavLinkActive : ''}`}
                  onClick={() => isMobile && setMobileOpen(false)}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Button
        variant="outlined"
        color="error"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        sx={{ 
          mt: 2, 
          width: '100%',
          borderColor: '#ef4444',
          color: '#ef4444',
          '&:hover': {
            borderColor: '#dc2626',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
          }
        }}
      >
        Logout
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ 
            position: 'fixed', 
            top: 16, 
            left: 16, 
            zIndex: 1300,
            background: 'rgba(36, 37, 54, 0.97)',
            color: '#38bdf8',
            '&:hover': { background: 'rgba(56, 189, 248, 0.1)' }
          }}
        >
          <MenuIcon />
        </IconButton>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: 220,
              boxSizing: 'border-box',
              background: 'rgba(36, 37, 54, 0.97)',
              borderRight: '1.5px solid #38bdf833',
              display: 'flex',
              flexDirection: 'column',
              padding: '2.5rem 1.2rem 2rem 1.2rem',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      </>
    );
  }

  return (
    <aside className={styles.adminSidebar}>
      {sidebarContent}
    </aside>
  );
}
