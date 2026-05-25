/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cream': '#f8f3ea',
        'ink': '#1A1814',
        'rust': '#c54b13',
        'gold': '#D4A017',
        'sage': '#4A7C59',
        'dust': '#8C7B6B',
        'paper': '#EDE8DC',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        serif: ['Instrument Serif', 'serif'],
      },
    },
  },
  plugins: [],
};
