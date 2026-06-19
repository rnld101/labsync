import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Brand — richer teal (replaces flat #008080)
        primary: {
          50:  "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          900: "#134E4A",
          DEFAULT: "#0D9488",
        },
        // Page surfaces
        background: "#FFFFFF",
        surface: "#F8FAFC",
        // Semantic — all pass WCAG AA on white
        success: {
          50:  "#ECFDF5",
          500: "#059669",
          DEFAULT: "#059669",
        },
        warning: {
          50:  "#FFFBEB",
          500: "#D97706",
          DEFAULT: "#D97706",
        },
        danger: {
          50:  "#FEF2F2",
          500: "#DC2626",
          DEFAULT: "#DC2626",
        },
        info: {
          50:  "#EFF6FF",
          500: "#2563EB",
          DEFAULT: "#2563EB",
        },
        // Text
        "text-dark":  "#0F172A",
        "text-muted": "#475569",
      },
      borderRadius: {
        sm:    "6px",
        md:    "8px",
        lg:    "12px",
        bento: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        "elevation-1": "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "elevation-2": "0 4px 16px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
        "elevation-3": "0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        "bento-diffused": "0 4px 16px rgba(13,148,136,0.06), 0 2px 8px rgba(0,0,0,0.04)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "bounce-dot": "bounce-dot 1.2s ease-in-out infinite",
        "fade-in": "fade-in 200ms ease-out",
        "slide-in-right": "slide-in-right 350ms cubic-bezier(0.16,1,0.3,1)",
        "slide-in-up": "slide-in-up 350ms cubic-bezier(0.16,1,0.3,1)",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "translateY(0)" },
          "40%":           { transform: "translateY(-6px)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "slide-in-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
