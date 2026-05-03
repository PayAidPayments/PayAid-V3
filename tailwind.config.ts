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
        // PayAid Brand Colors - Primary Palette
        // Purple: #53328A (Trust, Premium, Enterprise) - 10 shades
        purple: {
          50: '#F5F3F9',
          100: '#E8E3F0',
          200: '#D1C7E1',
          300: '#BAABD2',
          400: '#A38FC3',
          500: '#53328A', // Base - Primary brand color
          600: '#4A2D7A',
          700: '#3F1F62',
          800: '#341A4F',
          900: '#29143C',
          950: '#1E0F29',
        },
        // Gold: #F5C700 (Energy, Success, Value) - 10 shades
        gold: {
          50: '#FFFDF0',
          100: '#FFFBE0',
          200: '#FFF7C0',
          300: '#FFF3A0',
          400: '#FFEF80',
          500: '#F5C700', // Base - Accent brand color
          600: '#E0B200',
          700: '#CC9D00',
          800: '#B88800',
          900: '#A37300',
          950: '#8F5E00',
        },
        
        // Semantic Colors (Professional supporting colors)
        success: {
          DEFAULT: '#059669', // Emerald - Success states
          light: '#D1FAE5',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#D97706', // Amber - Warning states
          light: '#FEF3C7',
          dark: '#B45309',
        },
        error: {
          DEFAULT: '#DC2626', // Red - Error states
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
        info: {
          DEFAULT: '#0284C7', // Blue - Info states
          light: '#DBEAFE',
          dark: '#0369A1',
        },
        
        // Neutral Scale (100 = lightest, 900 = darkest)
        gray: {
          50: '#F9FAFB', // Backgrounds, hover states
          100: '#F3F4F6', // Cards, panels
          200: '#E5E7EB', // Subtle borders
          300: '#D1D5DB', // Borders, dividers, disabled states
          400: '#9CA3AF', // Disabled/Muted text
          500: '#6B7280', // Placeholder text
          600: '#4B5563', // Secondary text
          700: '#374151', // Primary text
          800: '#1F2937', // Dark text
          900: '#111827', // Headings, dark text
          950: '#030712', // Darkest
        },
        
        // Legacy support (keep for backward compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#53328A", // PayAid Purple - Primary brand color
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "#DC2626", // Error red
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#F5C700", // PayAid Gold - Accent brand color
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
        
        // PayAid brand color aliases (for backward compatibility)
        payaid: {
          purple: "#53328A",
          "purple-50": "#F5F3F9",
          "purple-100": "#E8E3F0",
          "purple-200": "#D1C7E1",
          "purple-300": "#BAABD2",
          "purple-400": "#A38FC3",
          "purple-500": "#53328A",
          "purple-600": "#4A2D7A",
          "purple-700": "#3F1F62",
          "purple-800": "#341A4F",
          "purple-900": "#29143C",
          "purple-950": "#1E0F29",
          "purple-dark": "#3F1F62",
          "purple-hover": "#4A2D7A",
          gold: "#F5C700",
          "gold-50": "#FFFDF0",
          "gold-100": "#FFFBE0",
          "gold-200": "#FFF7C0",
          "gold-300": "#FFF3A0",
          "gold-400": "#FFEF80",
          "gold-500": "#F5C700",
          "gold-600": "#E0B200",
          "gold-700": "#CC9D00",
          "gold-800": "#B88800",
          "gold-900": "#A37300",
          "gold-950": "#8F5E00",
          "gold-hover": "#E0B200",
          charcoal: "#414143",
        },
        
        // Legacy color aliases (deprecated - use purple/gold instead)
        'teal-primary': '#53328A', // Alias to purple-500
        'blue-secondary': '#0284C7', // Use info instead
        'emerald-success': '#059669', // Use success instead
        'amber-alert': '#D97706', // Use warning instead
        'red-error': '#DC2626', // Use error instead
        'gold-accent': '#F5C700', // Alias to gold-500
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

