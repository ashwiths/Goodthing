/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0A0A0F",
          surface: "#111118",
          card: "#16161F",
        },
        neon: {
          cyan: "#00F5FF",
          violet: "#8B5CF6",
          pink: "#F72585",
          green: "#39FF14",
          amber: "#FFB703",
        },
      },
    },
  },
  plugins: [],
};
