/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakrie: {
          maroon: '#800000',
          gold: '#D4AF37',
          dark: '#4A0000',
          light: '#FFF5F5'
        }
      }
    },
  },
  plugins: [],
}
