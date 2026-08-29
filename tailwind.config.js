/** @type {import('tailwindcss').Config} */

/* Renascor neutral ramp (2026-08-17). The archive/product pages were written on
   Tailwind's zinc/slate scales; rather than sweep ~50 files class-by-class, the
   scales themselves are remapped to Renascor-derived neutrals so every page is
   on the house palette by construction. 50→100 are the bone grounds, 900→950 the
   green-deep inks; the dark: variants those pages already use pick from the same
   ramp. `white` maps to the surface bone so cards and dark-mode text land on
   brand. Values derive from src/index.css tokens (bone #F3EFE7 / surface
   #FAF8F3 / ink #101512 / green-deep #042A1D). */
const renascorNeutral = {
  50: '#FAF8F3',
  100: '#F3EFE7',
  200: '#E3DCCB',
  300: '#CBC2AD',
  400: '#84816F',
  500: '#5D5F55',
  600: '#464A3F',
  700: '#2F3A30',
  800: '#17281E',
  900: '#101512',
  950: '#042A1D',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        zinc: renascorNeutral,
        slate: renascorNeutral,
        white: '#FAF8F3',
      },
    },
  },
  plugins: [],
};
