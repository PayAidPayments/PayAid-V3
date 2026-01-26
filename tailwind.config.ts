import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors (PayAid UI/UX Standards)
        'teal-primary': '#0F766E', // Deep Teal - Primary actions
        'blue-secondary': '#0284C7', // Vibrant Blue - Secondary actions
        'emerald-success': '#059669', // Success - Approvals, positive actions
        'amber-alert': '#D97706', // Alert - Warnings, attention-needed
        'red-error': '#DC2626', // Error - Critical issues, destructive actions
        'gold-accent': '#FBBF24', // Accent Gold - Premium features
        
        // Neutral Scale (100 = lightest, 900 = darkest)
        gray: {
          50: '#F9FAFB', // Backgrounds, hover states
          100: '#F3F4F6', // Cards, panels
          300: '#D1D5DB', // Borders, dividers, disabled states
          400: '#9CA3AF', // Disabled/Muted text
          600: '#4B5563', // Secondary text
          700: '#374151', // Primary text
          900: '#111827', // Headings, dark text
        },
        
        // Legacy support (keep for backward compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0F766E", // Use teal-primary
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "#DC2626", // Use red-error
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#FBBF24", // Use gold-accent
          foreground: "#111827",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        payaid: {
          gold: "#FBBF24", // Updated to match design system
          "gold-hover": "#E0B200",
          purple: "#53328A",
          "purple-dark": "#3F1F62",
          "purple-hover": "#3F1F62",
          charcoal: "#414143",
        },
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'slide-up': 'slideInUp 300ms ease-out',
        'slide-left': 'slideInLeft 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'pulse-light': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideInUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInLeft: {
          'from': {
            opacity: '0',
            transform: 'translateX(-16px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        scaleIn: {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;

