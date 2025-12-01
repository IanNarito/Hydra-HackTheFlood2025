/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'Helvetica', 'sans-serif'],
        play: ['Play', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
}