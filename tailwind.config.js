/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.6s ease-in-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      colors: {
        // Unified design system colors
        background: {
          DEFAULT: '#181824',
          dark: '#0f0f1a',
          navy: '#232946',
        },
        primary: {
          DEFAULT: '#3b82f6',      // blue-500
          pink: '#ec4899',         // pink-500
          purple: '#8b5cf6',       // purple-500
        },
        wokeness: {
          green: '#10b981',        // Not woke
          yellow: '#f59e0b',       // Moderate
          red: '#ef4444',          // Very woke
        },
        text: {
          DEFAULT: '#ffffff',
          secondary: '#93c5fd',
          muted: '#9ca3af',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.2)',
          light: 'rgba(255, 255, 255, 0.1)',
          strong: 'rgba(255, 255, 255, 0.3)',
        },
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
      },
      borderRadius: {
        xl: '1.25rem',
        lg: '1rem',
        md: '0.75rem',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['1.12rem', '1.9'],
        lg: ['1.3rem', '2.1'],
        xl: ['1.7rem', '2.3'],
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(31, 41, 55, 0.07)',
        nav: '0 2px 8px 0 rgba(31, 41, 55, 0.04)',
      },
      transitionProperty: {
        'colors-spacing': 'background-color, border-color, color, fill, stroke, margin, padding',
      },
    },
  },
  plugins: [],
};
