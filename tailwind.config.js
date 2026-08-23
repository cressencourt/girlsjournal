/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "ui-rounded", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
