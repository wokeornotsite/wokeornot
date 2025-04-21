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
        background: {
          DEFAULT: '#f9fafb', // ultra-light background
          subtle: '#e0e7ef', // secondary background, very pale
        },
        surface: {
          DEFAULT: '#fff', // card and nav surfaces
          muted: '#f4f5f7',
        },
        primary: {
          DEFAULT: '#2563eb', // modern blue accent
          light: '#60a5fa',
          dark: '#1e40af',
        },
        highlight: {
          DEFAULT: '#ffe066', // IMDb-inspired yellow for highlights
          soft: '#fff9db',
        },
        border: '#f1f5f9', // ultra-light border
        text: {
          DEFAULT: '#22292f', // main text, softer than black
          muted: '#6b7280',   // muted/secondary text
        },
        error: '#ef4444',
        success: '#22c55e',
        warning: '#f59e42',
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
