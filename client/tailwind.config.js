/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1f1a14',
          soft: '#3a3026',
          muted: '#6b5c4c',
        },
        sand: {
          DEFAULT: '#f7f1e6',
          soft: '#fffdf8',
          deep: '#e8dcc6',
        },
        gold: {
          DEFAULT: '#b8902a',
          light: '#d4af37',
          dark: '#8a6b1f',
        },
        stone: {
          DEFAULT: '#5c5348',
          light: '#9a8f80',
        },
      },
      fontFamily: {
        display: ['"Playfair Display Variable"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 50px -24px rgba(31, 26, 20, 0.45)',
        card: '0 10px 30px -16px rgba(31, 26, 20, 0.35)',
      },
      backgroundImage: {
        'hero-veil':
          'linear-gradient(180deg, rgba(31,26,20,0.55) 0%, rgba(31,26,20,0.35) 45%, rgba(31,26,20,0.82) 100%)',
        'gold-line': 'linear-gradient(90deg, transparent, #d4af37, transparent)',
      },
    },
  },
  plugins: [],
};
