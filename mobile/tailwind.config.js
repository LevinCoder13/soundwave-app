/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          dark: '#121212',
          lightdark: '#181818',
          card: '#282828',
          subtext: '#B3B3B3',
        },
      },
    },
  },
  plugins: [],
};
