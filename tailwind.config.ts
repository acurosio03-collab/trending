import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#050912", 900: "#0a1020", 800: "#0f1830", 700: "#16233f", 600: "#1f3157" },
        neon: "#18ff8a",
        loss: "#ff4d6a",
        electric: "#2f8bff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(47,139,255,0.25)",
        neon: "0 0 20px rgba(24,255,138,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
