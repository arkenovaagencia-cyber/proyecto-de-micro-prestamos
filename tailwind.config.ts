import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF6F5", 100: "#D9EBE8", 300: "#5C9C93",
          500: "#0B4F4A", 600: "#0A4440", 700: "#073835", 800: "#052624",
        },
        accent: {
          50: "#FFF3EA", 300: "#FFB37A", 500: "#FF8A3D", 600: "#E06E22",
        },
        success: { 50: "#EAFAF2", 500: "#1F9D6B", 600: "#178055" },
        warning: { 50: "#FFF7E6", 500: "#C98A00" },
        danger:  { 50: "#FDEDED", 500: "#D14545", 600: "#B23A3A" },
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.03), 0 10px 30px -14px rgb(0 0 0 / 0.10)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
