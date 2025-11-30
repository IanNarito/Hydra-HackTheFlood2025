/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: "var(--inter-font-family)",
        play: ['Play', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
}