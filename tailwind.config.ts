import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#D4AF37"
        },
        crimson: {
          DEFAULT: "#8B0000"
        }
      },
      boxShadow: {
        glowGold: "0 0 0 1px rgba(212,175,55,0.20), 0 0 22px rgba(212,175,55,0.22)",
        glowCrimson: "0 0 0 1px rgba(139,0,0,0.22), 0 0 22px rgba(139,0,0,0.22)"
      },
      keyframes: {
        "spin-slow": {
          to: { transform: "rotate(360deg)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        dust: {
          "0%": { transform: "translate3d(0,0,0)", opacity: "0.0" },
          "10%": { opacity: "0.65" },
          "100%": { transform: "translate3d(0,-18px,0)", opacity: "0.0" }
        },
        "sigil-drift": {
          "0%": { backgroundPosition: "0px 0px, 0px 0px, 0px 0px" },
          "100%": { backgroundPosition: "240px -160px, -220px 120px, 120px 220px" }
        },
        "glow-pulse": {
          "0%, 100%": { filter: "drop-shadow(0 0 0 rgba(212,175,55,0.0))" },
          "50%": { filter: "drop-shadow(0 0 18px rgba(212,175,55,0.22))" }
        }
      },
      animation: {
        "spin-slow": "spin-slow 1.2s linear infinite",
        shimmer: "shimmer 6s ease infinite",
        float: "float 4s ease-in-out infinite",
        dust: "dust 1.2s ease-out infinite",
        "sigil-drift": "sigil-drift 18s linear infinite",
        "glow-pulse": "glow-pulse 2.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
