/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          orange: '#f97316',
          'orange-hover': '#ea580c',
          amber: '#f59e0b',
        },
        risk: {
          low: '#10b981',       // Green
          medium: '#f59e0b',    // Amber
          high: '#ea580c',      // Orange-red
          critical: '#ef4444',  // Deep red
        }
      }
    },
  },
  plugins: [],
}
