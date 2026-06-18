import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        qatar: {
          50: "#fff7fa",
          100: "#fce7ef",
          200: "#f6c2d2",
          300: "#ee95b0",
          400: "#df6489",
          500: "#c93b65",
          600: "#ab2048",
          700: "#8a1538",
          800: "#72122f",
          900: "#5b1027"
        },
        teal: {
          50: "#edfdfa",
          100: "#d2f7ef",
          200: "#a9eadf",
          500: "#16857b",
          700: "#0f5f59",
          900: "#123f3d"
        },
        gold: {
          50: "#fff8e8",
          100: "#fdecc4",
          300: "#e5bd68",
          500: "#b8892d",
          700: "#835f1d"
        },
        pearl: {
          50: "#fffdf8",
          100: "#f8f3e9",
          200: "#ede3d1",
          300: "#ddd0bb"
        }
      },
      boxShadow: {
        soft: "0 24px 80px rgba(138, 21, 56, 0.14)",
        glow: "0 0 0 1px rgba(138,21,56,0.08), 0 20px 50px rgba(138,21,56,0.12)"
      },
      backgroundImage: {
        "qatar-gradient": "linear-gradient(135deg, #8a1538 0%, #5f1029 55%, #ffffff 220%)",
        "hero-grid": "radial-gradient(circle at top right, rgba(138,21,56,0.10), transparent 28%), radial-gradient(circle at bottom left, rgba(138,21,56,0.06), transparent 24%), linear-gradient(180deg, #fff 0%, #fff8fb 100%)"
      },
      fontFamily: {
        cairo: ["var(--font-cairo)", "Cairo", "Tajawal", "Dubai", "Aptos", "Calibri", "Segoe UI Variable", "Segoe UI", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "120% 0%" }
        }
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        shimmer: "shimmer 3.2s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
