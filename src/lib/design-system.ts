/**
 * Unified Design System for WokeOrNot
 * Single source of truth for colors, spacing, typography, and other design tokens
 */

// Brand Colors
export const colors = {
  // Primary brand gradient (Pink to Blue)
  primary: {
    pink: '#ec4899',      // pink-500
    pinkDark: '#db2777',  // pink-600
    blue: '#3b82f6',      // blue-500
    blueDark: '#2563eb',  // blue-600
    purple: '#8b5cf6',    // purple-500
  },

  // Background colors
  background: {
    dark: '#181824',      // Main dark background
    darker: '#0f0f1a',    // Darker variant
    navy: '#232946',      // Navy blue background
    overlay: 'rgba(255, 255, 255, 0.1)', // Glass overlay
  },

  // Wokeness scores
  wokeness: {
    notWoke: {
      light: '#d1fae5',   // green-100
      medium: '#6ee7b7',  // green-300
      dark: '#10b981',    // green-500
      darker: '#059669',  // green-600
    },
    moderate: {
      light: '#fef9c3',   // yellow-100
      medium: '#fde68a',  // yellow-200
      dark: '#f59e0b',    // amber-500
      darker: '#d97706',  // amber-600
    },
    veryWoke: {
      light: '#fee2e2',   // red-100
      medium: '#fca5a5',  // red-300
      dark: '#ef4444',    // red-500
      darker: '#dc2626',  // red-600
    },
  },

  // UI elements
  text: {
    primary: '#ffffff',
    secondary: '#93c5fd',   // blue-300
    muted: '#9ca3af',       // gray-400
    inverse: '#111827',     // gray-900
  },

  border: {
    light: 'rgba(255, 255, 255, 0.2)',
    medium: 'rgba(255, 255, 255, 0.3)',
    strong: 'rgba(255, 255, 255, 0.4)',
  },

  // Status colors
  status: {
    success: '#10b981',   // green-500
    warning: '#f59e0b',   // amber-500
    error: '#ef4444',     // red-500
    info: '#3b82f6',      // blue-500
  },

  // Semantic colors
  semantic: {
    danger: '#dc2626',    // red-600
    dangerHover: '#b91c1c', // red-700
    success: '#16a34a',   // green-600
    successHover: '#15803d', // green-700
  },
};

// Gradients
export const gradients = {
  primary: 'linear-gradient(to right, #ec4899, #3b82f6)', // pink to blue
  primaryReverse: 'linear-gradient(to right, #3b82f6, #ec4899)', // blue to pink
  background: 'linear-gradient(to bottom right, #181824, #232946, #181824)',
  overlay: 'linear-gradient(to bottom right, rgba(236, 72, 153, 0.6), rgba(59, 130, 246, 0.6), rgba(139, 92, 246, 0.6))',
  card: 'linear-gradient(to bottom right, #232946, rgba(35, 41, 70, 0.8), #181824)',
};

// Spacing scale (in rem)
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
};

// Typography
export const typography = {
  fontFamily: {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',     // 2px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  glow: '0 0 20px rgba(236, 72, 153, 0.5)', // Pink glow
  glowBlue: '0 0 20px rgba(59, 130, 246, 0.5)', // Blue glow
};

// Transitions
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
};

// Breakpoints (for responsive design)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Helper function to get color with opacity
export function withOpacity(color: string, opacity: number): string {
  // Simple hex to rgba converter
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

// Common class name combinations
export const commonClasses = {
  card: 'rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl',
  button: 'px-6 py-3 rounded-lg font-semibold transition-all duration-200',
  input: 'px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-pink-400',
  gradientText: 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent',
  gradientBg: 'bg-gradient-to-r from-pink-500 to-blue-500',
};

export const designSystem = {
  colors,
  gradients,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  withOpacity,
  commonClasses,
};

export default designSystem;
