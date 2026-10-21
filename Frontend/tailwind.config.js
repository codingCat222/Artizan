/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // AAON palette: primary #0B3F24, text #145C34, accent #127A34, secondary #F3F8F5
        forest: {
          50: "#F3F8F5",
          100: "#DDEBE3",
          200: "#BFDCCB",
          300: "#8FD4A8",
          400: "#2E9B52",
          500: "#127A34",
          600: "#145C34",
          700: "#0F4A2A",
          800: "#0B3F24",
          900: "#072A18",
        },
        mint: "#D7F3E3",
        fresh: {
          50: "#EAF6EE",
          400: "#8FD4A8",
          500: "#127A34",
          600: "#0E6229",
        },
        gold: {
          400: "#e0b84a",
          500: "#cfa030",
          600: "#b3881f",
        },
      },
      fontFamily: {
        sans: ["Inter Tight", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,63,36,0.06), 0 4px 16px rgba(11,63,36,0.07)",
      },
    },
  },
  plugins: [],
};
