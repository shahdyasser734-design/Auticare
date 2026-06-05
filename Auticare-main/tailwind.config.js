/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "soft-bg": "#f8f9fb",
        "soft-gray": "#e8eaed",
        "soft-text": "#2c3e50",

        slate: {
          50: "#FFF8F0",
          100: "#F6F1E8",
          200: "#EADBC8",
          300: "#D9C7B0",
          400: "#BFA68E",
          500: "#9E8670",
          600: "#7E6855",
          700: "#5F4B3C",
          800: "#453327",
          900: "#2C1E14",
          950: "#1A1008",
        },

        navy: {
          50: "#f0f3f8",
          100: "#d9dfe8",
          200: "#c3cbd7",
          300: "#a4afc4",
          400: "#8597b0",
          500: "#667fa0",
          600: "#4a6080",
          700: "#37495f",
          800: "#243140",
          900: "#1a2d4d",
        },

        orange: {
          50: "#fef5f0",
          100: "#fce8df",
          200: "#fad1be",
          300: "#f6b39a",
          400: "#f08968",
          500: "#d97706",
          600: "#c05805",
          700: "#9d3d04",
          800: "#6d2904",
          900: "#3d1502",
        },

        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c3d66",
        },

        secondary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },

        success: {
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },

        warning: {
          50: "#fffbeb",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
        },

        danger: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },

        neutral: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },

      animation: {
        "fade-in": "fadeIn 0.3s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
        "spin-slow": "spin 6s linear infinite",
        "scale-pulse": "scalePulse 2s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scalePulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};