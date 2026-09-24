/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf5f5",
          100: "#dfeceb",
          200: "#bfdad8",
          300: "#94c0be",
          400: "#5e9d9d",
          500: "#3e7d7f",
          600: "#2d6465",
          700: "#254f50",
          800: "#1d4041",
          900: "#0f3d3e",
        },
        accent: "#c9a227",
        sand: "#faf8f3",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 61, 62, 0.08)",
      },
    },
  },
  plugins: [],
};
