/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#1e3a5f',
        },
        surface: {
          DEFAULT: '#f8fafc',
          card: '#ffffff',
          muted: '#e2e8f0',
        },
      },
      minHeight: {
        tap: '48px',
      },
      minWidth: {
        tap: '48px',
      },
      fontSize: {
        'display': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '26px' }],
      },
    },
  },
  plugins: [],
};
