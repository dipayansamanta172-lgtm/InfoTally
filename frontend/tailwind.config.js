/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryBg: '#FFFFFF',
        softBlue: '#DFE5F3',
        mutedGreen: '#557373',
        warmWhite: '#F2EFEA',
        primaryText: '#0D0D0D',
        darkCardBg: '#161616',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      maxWidth: {
        'dashboard': '1600px',
      }
    },
  },
  plugins: [],
}
