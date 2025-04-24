import React from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ReviewsIcon from '@mui/icons-material/RateReview';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import BarChartIcon from '@mui/icons-material/BarChart';

const navLinks = [
  { href: '/admin', icon: <DashboardIcon />, label: 'Dashboard' },
  { href: '/admin/moderation', icon: <ReviewsIcon />, label: 'Moderation' },
  { href: '/admin/content', icon: <ManageSearchIcon />, label: 'Content' },
  { href: '/admin/analytics', icon: <BarChartIcon />, label: 'Analytics' },
  { href: '/admin/users', icon: <PeopleIcon />, label: 'Users' },
];

export default function AdminSidebar() {
  return (
    <aside className={styles.adminSidebar}>
      <div className={styles.adminLogo}>WokeOrNot Admin</div>
      <nav>
        <ul className={styles.adminNavList}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={styles.adminNavLink}>
                {link.icon}
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
