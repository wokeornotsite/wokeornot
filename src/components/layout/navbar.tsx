'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Search } from 'lucide-react';
import styles from './navbar.module.css';
import type { Session } from 'next-auth';

function UserDropdownMenu({ session }: { session: Session | null }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen]);

  if (!session || !session.user) return null;
  return (
    <div ref={wrapperRef} className="relative">
      <button
        className="flex items-center space-x-1 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300">
          <Image
            src={(session.user as any).avatar || session.user.image || '/avatars/default.png'}
            alt={session.user.name || 'User'}
            className="w-full h-full object-cover"
            width={32}
            height={32}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/avatar-placeholder.png'; }}
            priority
          />
        </div>
      </button>
      <div
        className={`absolute right-0 mt-2 w-52 py-2 z-50 transition-opacity duration-150 ${styles.dropdown} ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        tabIndex={-1}
      >
        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Profile
        </Link>
        {session.user.role === 'ADMIN' && (
          <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Admin Panel
          </Link>
        )}
        <button
          onClick={() => signOut()}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export const Navbar = () => {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/movies', label: 'Movies' },
    { href: '/tv-shows', label: 'TV Shows' },
    { href: '/kids', label: 'Kids' },
    // Forum link removed as feature is not yet implemented
  ];

  return (
    <header className={`${styles.glass} ${styles.shadow} sticky top-0 z-50 font-sans text-base rounded-b-xl`}>
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className={`${styles.logo} select-none`}>
          <span className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="14" fill="#2563eb" opacity="0.13"/><path d="M8 19c0-3 4-7 6-7s6 4 6 7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/><circle cx="14" cy="12" r="2" fill="#2563eb"/></svg>
          </span>
          <span style={{color:'#2563eb'}}>Woke</span><span style={{color:'#1e293b'}}>OrNot</span>
        </Link>
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-6">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </Link>
          ))}
          {session && (
            <Link href="/profile" className={styles.link}>Profile</Link>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Link href="/search" className="text-gray-400 hover:text-primary p-2 rounded-full transition-colors duration-200">
            <Search className="h-5 w-5" />
          </Link>
          {session ? (
            <UserDropdownMenu session={session} />
          ) : (
            <Link href="/login" className="px-5 py-2 rounded-full font-semibold shadow-lg border-2 border-white bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 transition-colors duration-200">Sign In</Link>
          )}
        </div>
        {/* Mobile Hamburger */}
        <button
          className={`md:hidden ${styles.menuButton} ml-2`}
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Mobile Menu Overlay */}
        <div
          className={
            `${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`
          }
          tabIndex={-1}
          aria-hidden={!mobileOpen}
        >
          <button
            className={`absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-primary transition-colors duration-200`}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="mt-16">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className={styles.mobileMenuLink} onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
            {session && (
              <Link href="/profile" className={styles.mobileMenuLink} onClick={() => setMobileOpen(false)}>
                Profile
              </Link>
            )}
            {!session && (
              <Link href="/login" className={styles.mobileMenuLink} onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </div>
        {/* Mobile Menu Overlay - click outside to close */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-20"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </nav>
    </header>
  );
};
