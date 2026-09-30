/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        primary: "#A84F35",
        background: "#F8F0F0",
        surface: "#F8E8E0",
        surfaceSelected: "#F8E0D8",
        text: "#302522",
        textSecondary: "#756A66",
        white: "#FFFFFF",
        success: "#34A853",
        accent: "#F4C20D",
        link: "#2563EB",
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
      },
    },
  },
  plugins: [],
}
