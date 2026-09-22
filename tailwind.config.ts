import type { Config } from "tailwindcss";

/**
 * KUTUBI DESIGN TOKENS — "The Digital Library"
 * Single source of truth for the visual system.
 * See docs/VISUAL_SYSTEM.md for the full contract.
 */

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
        // Surfaces
        paper: {
          DEFAULT: "#FBF8F2",
          deep: "#F4EEE3"
        },
        surface: "#FFFFFF",
        // Ink (text)
        ink: {
          DEFAULT: "#1C1A17",
          soft: "#4A443C",
          faint: "#857D70",
          deep: "#221E1A"
        },
        // Lines
        line: {
          DEFAULT: "#E6DFD2",
          strong: "#D5CBB9"
        },
        // Brand
        brand: {
          DEFAULT: "#8A1538",
          deep: "#6B102B",
          soft: "#F7E9EE"
        },
        // Signals
        accent: {
          teal: "#0F766E",
          "teal-soft": "#E4F3F1",
          gold: "#B8892D",
          "gold-soft": "#F7EFDC",
          danger: "#B3261E",
          "danger-soft": "#FBEAE9"
        }
      },
      fontFamily: {
        sans: ["var(--font-plex)", "system-ui", "sans-serif"]
      },
      fontSize: {
        // [font-size, line-height] — Arabic-first line heights
        display: ["clamp(2.25rem, 5.5vw, 3.5rem)", { lineHeight: "1.2" }],
        h1: ["clamp(1.875rem, 3.6vw, 2.625rem)", { lineHeight: "1.25" }],
        h2: ["clamp(1.5rem, 2.6vw, 2rem)", { lineHeight: "1.3" }],
        h3: ["1.25rem", { lineHeight: "1.4" }],
        h4: ["1.0625rem", { lineHeight: "1.45" }],
        lead: ["1.125rem", { lineHeight: "1.9" }],
        body: ["1rem", { lineHeight: "1.9" }],
        "body-sm": ["0.875rem", { lineHeight: "1.8" }],
        caption: ["0.8125rem", { lineHeight: "1.6" }],
        label: ["0.75rem", { lineHeight: "1.5" }],
        price: ["1.375rem", { lineHeight: "1.2" }],
        "price-lg": ["1.75rem", { lineHeight: "1.2" }]
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        pill: "999px",
        // keep tailwind's full/none; forbid anything else in code review
        full: "9999px",
        none: "0"
      },
      boxShadow: {
        soft: "0 1px 2px rgb(28 26 23 / 0.04), 0 4px 12px rgb(28 26 23 / 0.04)",
        lift: "0 2px 4px rgb(28 26 23 / 0.05), 0 12px 28px rgb(28 26 23 / 0.08)",
        pop: "0 4px 8px rgb(28 26 23 / 0.06), 0 24px 56px rgb(28 26 23 / 0.12)",
        none: "0 0 #0000"
      },
      // Section rhythm
      spacing: {
        "section": "80px",
        "section-lg": "128px",
        "section-md": "64px",
        "section-sm": "40px"
      },
      maxWidth: {
        wide: "1440px",
        content: "1200px",
        text: "720px"
      },
      // Motion tokens (used via CSS vars; documented for reference)
      transitionDuration: {
        instant: "120ms",
        fast: "180ms",
        normal: "260ms",
        slow: "420ms"
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        enter: "cubic-bezier(0.16, 1, 0.3, 1)",
        exit: "cubic-bezier(0.7, 0, 0.84, 0)"
      }
    }
  },
  plugins: []
};

export default config;
