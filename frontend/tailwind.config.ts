import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Resolved as CSS-variable-compatible colors via RGB channels */
        steel: {
          50:  "rgb(var(--steel-50-rgb) / <alpha-value>)",
          100: "rgb(var(--steel-100-rgb) / <alpha-value>)",
          200: "rgb(var(--steel-200-rgb) / <alpha-value>)",
          300: "rgb(var(--steel-300-rgb) / <alpha-value>)",
          400: "rgb(var(--steel-400-rgb) / <alpha-value>)",
          500: "rgb(var(--steel-500-rgb) / <alpha-value>)",
          600: "rgb(var(--steel-600-rgb) / <alpha-value>)",
          700: "rgb(var(--steel-700-rgb) / <alpha-value>)",
          800: "rgb(var(--steel-800-rgb) / <alpha-value>)",
          900: "rgb(var(--steel-900-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          light:   "rgb(var(--accent-light-rgb) / <alpha-value>)",
          dark:    "rgb(var(--accent-dark-rgb) / <alpha-value>)",
        },
        "steel-accent": {
          DEFAULT: "rgb(var(--steel-accent-rgb) / <alpha-value>)",
          light:   "rgb(var(--steel-accent-light-rgb) / <alpha-value>)",
        },
        ibm: {
          cyan:    "#1192e8",
          teal:    "#009d9a",
          green:   "#24a148",
          magenta: "#ee5396",
        },
        risk: {
          low:      "rgb(var(--risk-low-rgb) / <alpha-value>)",
          medium:   "rgb(var(--risk-medium-rgb) / <alpha-value>)",
          high:     "rgb(var(--risk-high-rgb) / <alpha-value>)",
          critical: "rgb(var(--risk-critical-rgb) / <alpha-value>)",
        },
        panel: {
          DEFAULT: "rgb(var(--panel-bg-rgb) / <alpha-value>)",
          border:  "rgb(var(--panel-border-rgb) / <alpha-value>)",
          hover:   "rgb(var(--panel-hover-rgb) / <alpha-value>)",
        },
        surface: {
          0: "rgb(var(--surface-0-rgb) / <alpha-value>)",
          1: "rgb(var(--surface-1-rgb) / <alpha-value>)",
          2: "rgb(var(--surface-2-rgb) / <alpha-value>)",
          3: "rgb(var(--surface-3-rgb) / <alpha-value>)",
          4: "rgb(var(--surface-4-rgb) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--risk-low-rgb) / <alpha-value>)",
          light: "rgb(var(--risk-low-rgb) / 0.15)",
        },
        warning: {
          DEFAULT: "rgb(var(--risk-medium-rgb) / <alpha-value>)",
          light: "rgb(var(--risk-medium-rgb) / 0.15)",
        },
        danger: {
          DEFAULT: "rgb(var(--risk-critical-rgb) / <alpha-value>)",
          light: "rgb(var(--risk-critical-rgb) / 0.15)",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["IBM Plex Mono", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.03em" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.03em" }],
        "5xl": ["3rem", { lineHeight: "1", letterSpacing: "-0.04em" }],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        panel: "0 2px 8px rgba(0,0,0,0.3)",
        glow:  "0 0 0 1px rgba(15,98,254,0.3), 0 0 20px rgba(15,98,254,0.15)",
        ibm:   "0 4px 16px rgba(0,0,0,0.4)",
        xs: "0 1px 2px rgba(0,0,0,0.15)",
        sm: "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15)",
        md: "0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -2px rgba(0,0,0,0.15)",
        lg: "0 10px 15px -3px rgba(0,0,0,0.25), 0 4px 6px -4px rgba(0,0,0,0.15)",
        xl: "0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.15)",
        "2xl": "0 25px 50px -12px rgba(0,0,0,0.5)",
        "inner-accent": "inset 0 1px 0 rgb(var(--accent-rgb) / 0.1)",
        "glow-accent": "0 0 20px rgb(var(--accent-rgb) / 0.2), 0 0 40px rgb(var(--accent-rgb) / 0.1)",
        "glow-critical": "0 0 20px rgb(var(--risk-critical-rgb) / 0.2), 0 0 40px rgb(var(--risk-critical-rgb) / 0.1)",
      },
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.4,0,0.2,1) both",
        "fade-in": "fadeIn 0.35s ease both",
        "slide-in-left": "slideInLeft 0.4s ease both",
        "scale-in": "scaleIn 0.35s ease both",
        "glow-pulse": "glowPulse 2.5s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 1.8s ease-in-out infinite",
        "slide-down": "slideDown 0.2s ease both",
        "slide-up": "slideUp 0.2s ease both",
        "count-up": "fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1) both",
      },
      keyframes: {
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        120: "30rem",
      },
      maxWidth: {
        "8xl": "90rem",
        "9xl": "96rem",
      },
    },
  },
  plugins: [],
};
export default config;
