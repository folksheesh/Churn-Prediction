/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f4ff',
          100: '#eceaff',
          200: '#dedcff',
          300: '#c5bfff',
          400: '#a599ff',
          500: '#836ffa', // main brand color similar to Streamlit's #6d5dfc
          600: '#6d5dfc',
          700: '#5c4ce3',
          800: '#4c3dbd',
          900: '#3f339c',
        },
        navy: {
          950: '#0b1220', // sidebar brand color from streamlit
        }
      },
    },
  },
  plugins: [],
};
