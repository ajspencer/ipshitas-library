/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary color - deep muted purple/slate
        primary: {
          DEFAULT: '#635C7B',
          light: '#7d7694',
          dark: '#4a4560',
          50: '#f5f4f7',
          100: '#e8e6ed',
          200: '#d4d0de',
          300: '#b5afc5',
          400: '#918aa8',
          500: '#635C7B',
          600: '#5a5470',
          700: '#4a4560',
          800: '#403c52',
          900: '#383446',
        },
        // Background cream color
        cream: {
          DEFAULT: '#fdfbf7',
          50: '#fefdfb',
          100: '#fdfbf7',
          200: '#f9f5ed',
          300: '#f3ebe0',
        },
        // Soft lavender accents
        lavender: {
          DEFAULT: '#e8e4f0',
          light: '#f3f0f8',
          dark: '#d9d3e6',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'cozy': '16px',
        'cozy-lg': '24px',
      },
      boxShadow: {
        'cozy': '0 4px 20px -2px rgba(99, 92, 123, 0.12), 0 2px 8px -2px rgba(99, 92, 123, 0.08)',
        'cozy-lg': '0 8px 32px -4px rgba(99, 92, 123, 0.15), 0 4px 12px -2px rgba(99, 92, 123, 0.1)',
        'cozy-hover': '0 12px 40px -4px rgba(99, 92, 123, 0.2), 0 6px 16px -2px rgba(99, 92, 123, 0.12)',
      },
    },
  },
  plugins: [],
}

