import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Severn Trent capital-business palette: a water/utility + engineering
        // identity. Deep navy base, teal/cyan primary, warm amber accent.
        st: {
          // Deep navy base + shades for the app shell and dark surfaces.
          ink: "#061525",
          navy: "#0b2740",
          "navy-700": "#0f3354",
          blue: "#1763a6",
          sky: "#2f9be0",
          // Teal/cyan primary — the "water" through-line of the brand.
          teal: "#15b3a6",
          "teal-600": "#0e9488",
          "teal-300": "#5fd6cc",
          cyan: "#22c3e6",
          // Warm amber/gold accent for highlights and calls-to-action.
          gold: "#e6a817",
          "gold-300": "#f3c95c",
          slate: "#334155",
        },
      },
      fontFamily: {
        // Wired up via next/font CSS variables in layout.tsx. Sensible
        // fallbacks keep things readable if the variable is ever missing.
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "ui-sans-serif", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        // Soft, layered shadows for the "premium card" feel.
        card: "0 1px 2px rgba(6, 21, 37, 0.04), 0 8px 24px -12px rgba(6, 21, 37, 0.18)",
        "card-lg": "0 2px 6px rgba(6, 21, 37, 0.05), 0 24px 48px -20px rgba(6, 21, 37, 0.30)",
        glow: "0 0 0 4px rgba(21, 179, 166, 0.18)",
      },
      backgroundImage: {
        "st-hero":
          "radial-gradient(1200px 400px at 12% -10%, rgba(34,195,230,0.18), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(21,179,166,0.16), transparent 55%), linear-gradient(120deg, #0b2740 0%, #0f3354 55%, #0b2740 100%)",
        "st-app":
          "radial-gradient(1000px 600px at 100% -5%, rgba(34,195,230,0.06), transparent 60%), radial-gradient(800px 500px at -10% 110%, rgba(21,179,166,0.07), transparent 55%), linear-gradient(180deg, #eef3f7 0%, #e7eef4 100%)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(230,168,23,0.45)" },
          "50%": { boxShadow: "0 0 0 6px rgba(230,168,23,0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.35s ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
