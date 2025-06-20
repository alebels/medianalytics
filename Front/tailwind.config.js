/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "selector",
  theme: {
    colors: {
      cBackground: "var(--color-background)",
      cText: "var(--color-text)",
      accent: "var(--color-accent)",
      miscellany: "var(--color-miscellany)",
    },
    fontFamily: {
      sans: ["SourceSans3", "sans-serif"],
      serif: ["Rasa", "serif"],
    },
    screens: {
      sym: { max: "430px" },
      sm: "640px",
      md: "768px",
      mym: { max: "950px" },
      lg: "1024px",
      lym: { max: "1095px" },
      xym: { max: "1245px" },
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {},
  },
  plugins: [require("tailwindcss-primeui")],
};
