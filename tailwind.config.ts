import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        night: { 950: '#040818', 800: '#0b1f4a' },
        accent: '#4f8bff',
        ink: '#e4edff',
      },
      fontFamily: {
        serif: ['Newsreader', 'serif'],
        sans: ['"Instrument Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
