import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc",
        foreground: "#0f172a",
        primary: "#0f766e",
        primaryForeground: "#f8fafc",
        muted: "#e2e8f0",
        mutedForeground: "#334155",
        border: "#cbd5e1",
        card: "#ffffff"
      }
    }
  },
  plugins: []
};

export default config;
