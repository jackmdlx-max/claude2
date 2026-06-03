import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Severn Trent-ish palette
        st: {
          navy: "#0b2740",
          blue: "#1763a6",
          sky: "#2f9be0",
          gold: "#e6a817",
          slate: "#334155",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
