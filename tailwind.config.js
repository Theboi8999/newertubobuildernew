/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#080B14', surface: '#0D1117', card: '#111827',
          border: '#1F2937', muted: '#374151',
          purple: '#7C3AED', 'purple-light': '#A78BFA',
          cyan: '#06B6D4', 'cyan-light': '#67E8F9',
          green: '#10B981', orange: '#F59E0B', red: '#EF4444',
          text: '#F9FAFB', 'text-muted': '#9CA3AF', 'text-dim': '#6B7280',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
}
