import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        // Flat page background (also hard-coded on html in style.css).
        night: { 950: '#060a18', 900: '#0d1428' },
        surface: 'rgba(140, 170, 230, 0.06)', // cards, over night.950
        line: 'rgba(127, 176, 255, 0.15)', // borders
        accent: '#7b9bd9', // links, active nav, close button
        ink: '#d9e2f2',
      },
      fontFamily: {
        serif: ['Newsreader', 'serif'],
        sans: ['"Instrument Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
