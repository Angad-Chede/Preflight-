/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          orange: '#f97316',
          'orange-hover': '#ea580c',
          amber: '#f59e0b',
        },
        risk: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ea580c',
          critical: '#ef4444',
        },
        neutral: {
          50: '#fafaf8',
          100: '#f5f5f0',
          150: '#ededea',
          200: '#e5e4df',
          300: '#d4d3cd',
          400: '#a8a79f',
          500: '#7c7b74',
          600: '#5e5d57',
          700: '#454440',
          800: '#2d2c29',
          900: '#1a1917',
          950: '#0f0e0d',
        }
      },
      boxShadow: {
        'glass': '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.02)',
        'glass-hover': '0 2px 8px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.035)',
        'card': '0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.02)',
        'elevated': '0 4px 12px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.04)',
        'bar': '0 -1px 0 rgba(0,0,0,0.03), 0 -8px 32px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
