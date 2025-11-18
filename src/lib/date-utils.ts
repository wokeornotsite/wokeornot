/**
 * Shared date utilities for consistent date handling across the application
 */

/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString().split('T')[0];
}

/**
 * Get year from date, returns empty string if invalid
 */
export function getYear(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return d.getFullYear().toString();
}

/**
 * Format date for display (e.g., "Jan 15, 2024")
 */
export function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date for display with time (e.g., "Jan 15, 2024 at 3:45 PM")
 */
export function formatDisplayDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function getRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return !isNaN(d.getTime());
}

/**
 * Parse date string safely, returns null if invalid
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  const d = new Date(dateString);
  
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Convert database date to client-safe string
 * Used when passing dates from server to client components
 */
export function toClientDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}

/**
 * Get age/time since date in years
 */
export function getYearsSince(date: Date | string | null | undefined): number {
  if (!date) return 0;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 0;
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  
  return Math.floor(diffYears);
}
