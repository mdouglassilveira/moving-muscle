import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Moving Muscle official palette
        brand: {
          DEFAULT: "#3cd3d6",
          100: "#3cd3d6", // accent / CTA
          200: "#34b7ba", // hover
          300: "#2c9b9e", // secondary accent
          400: "#247f82", // mid-tone
          500: "#1c6365", // dividers, muted on light
          600: "#144749", // dark surface
          700: "#0c2b2d", // deep background
          900: "#040f10"  // near-black
        },
        // UI tints (derived, used for soft backgrounds and subtle borders)
        mint: {
          50: "#e8f7f5",
          100: "#d1efec"
        },
        ink: {
          DEFAULT: "#1a2332",
          muted: "#6b7a8d",
          subtle: "#8d99a8"
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f8f9fb",
          page: "#f4f6f8",
          border: "#e9edf1",
          divider: "#e3e7ec"
        }
      },
      borderRadius: {
        card: "16px"
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06)",
        cardHover: "0 4px 14px rgba(0,0,0,0.08)"
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
