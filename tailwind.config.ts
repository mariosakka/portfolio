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
      // Height tiers for fitting each section in one screen (see --section-h in style.css).
      // short: 768/720-tall laptops and small phones; xshort: 667-tall phones. Below ~600px sections overflow by design.
      screens: {
        short: { raw: '(max-height: 800px)' },
        xshort: { raw: '(max-height: 700px)' },
      },
      fontFamily: {
        serif: ['Newsreader', 'serif'],
        sans: ['"Instrument Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
