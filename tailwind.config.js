/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B2A4A', // Deep Navy
          light: '#2A3F6A',
        },
        accent: {
          DEFAULT: '#C9A84C', // Gold
          light: '#D4B96F',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#F8F9FC', // Soft off-white
        },
        secondary: '#64748B',
        border: '#E2E8F0',
        success: '#16A34A',
        error: '#DC2626',
        warning: '#D97706',
        muted: '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 24px 10px -5px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
