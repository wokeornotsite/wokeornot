'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import useSWR from 'swr';

interface Notification {
  id: string;
  type: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data, mutate } = useSWR<NotificationsResponse>('/api/notifications', fetcher, {
    refreshInterval: 30_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const displayCount = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null;

  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleMarkAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    mutate();
  }

  async function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notification.id] }),
      });
      mutate();
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    marginTop: '0.5rem',
    width: '22rem',
    maxHeight: '28rem',
    overflowY: 'auto',
    zIndex: 50,
    borderRadius: '0.75rem',
    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.4)',
    background: '#1a1a2e',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'opacity 0.18s cubic-bezier(.4,0,.2,1)',
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'auto' : 'none',
  };

  const shown = notifications.slice(0, 10);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ position: 'relative', padding: '0.5rem', borderRadius: '9999px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        className="hover:text-white transition-colors duration-200"
      >
        <Bell className="h-5 w-5" />
        {displayCount && (
          <span
            style={{
              position: 'absolute',
              top: '0px',
              right: '0px',
              minWidth: '1.1rem',
              height: '1.1rem',
              borderRadius: '9999px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.2rem',
              lineHeight: 1,
            }}
          >
            {displayCount}
          </span>
        )}
      </button>

      <div style={dropdownStyle} tabIndex={-1}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{ color: '#a78bfa', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* List */}
        {shown.length === 0 ? (
          <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            No notifications yet
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {shown.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  {/* Unread dot */}
                  <span style={{ marginTop: '0.35rem', flexShrink: 0, width: '0.5rem', height: '0.5rem', borderRadius: '9999px', background: n.read ? 'transparent' : '#a78bfa', display: 'inline-block' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, color: n.read ? '#9ca3af' : '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    <p style={{ margin: '0.2rem 0 0', color: '#6b7280', fontSize: '0.75rem' }}>
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
