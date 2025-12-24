import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        payaid: {
          gold: "#F5C700",
          "gold-hover": "#E0B200",
          purple: "#53328A",
          "purple-dark": "#3F1F62",
          "purple-hover": "#3F1F62",
          charcoal: "#414143",
        },
      },
    },
  },
  plugins: [],
};
export default config;

