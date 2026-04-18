import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Safelist for dynamic color classes used in components
  safelist: [
    // Background colors with opacity
    { pattern: /bg-(primary|secondary|accent|green|amber|red|blue|purple|pink|teal|cyan|indigo|rose|orange|violet|emerald)(-\d+)?(\/(5|10|20|30|50))?/ },
    // Text colors
    { pattern: /text-(primary|secondary|accent|green|amber|red|blue|purple|pink|teal|cyan|indigo|rose|orange|violet|emerald)(-\d+)?/ },
    // Border colors with opacity
    { pattern: /border-(primary|secondary|accent|green|amber|red|blue|purple|pink|teal|cyan|indigo|rose|orange|violet|emerald)(-\d+)?(\/(20|30|50))?/ },
    // Shadow colors
    { pattern: /shadow-(primary|secondary|accent|green|amber|red|blue|purple|pink)(-\d+)?(\/(20|30))?/ },
    // Badge variants
    'badge-primary', 'badge-secondary', 'badge-accent', 'badge-success', 'badge-warning',
    'badge-green', 'badge-amber', 'badge-red', 'badge-blue', 'badge-purple',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          hover: 'hsl(var(--surface-hover))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          glow: 'hsl(var(--primary-glow))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        'sm': 'calc(var(--radius) - 4px)',
        'md': 'calc(var(--radius) - 2px)',
        'lg': 'var(--radius)',
        'xl': 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      animation: {
        // Core Animations
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',

        // Entrance Animations
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',

        // MagicUI Effects
        'border-beam': 'borderBeam 4s linear infinite',
        'marquee': 'marquee 25s linear infinite',
        'marquee-vertical': 'marqueeVertical 25s linear infinite',
        'shimmer-text': 'shimmerText 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',

        // Dock
        'dock-slide-up': 'dockSlideUp 0.8s ease-out',

        // Brand
        'logo-shimmer': 'logo-shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' },
          '100%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        borderBeam: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        shimmerText: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        dockSlideUp: {
          '0%': { opacity: '0', transform: 'translate(-50%, 20px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        marqueeVertical: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        'logo-shimmer': {
          '0%, 100%': { filter: 'drop-shadow(0 0 0 rgba(249,115,22,0))' },
          '50%': { filter: 'drop-shadow(0 0 12px rgba(249,115,22,0.6))' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-aurora': 'radial-gradient(at 0% 0%, hsl(var(--primary) / 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, hsl(var(--secondary) / 0.1) 0px, transparent 50%)',
      },
      boxShadow: {
        'glow': '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-lg': '0 0 40px hsl(var(--primary) / 0.4)',
        'inner-glow': 'inset 0 0 20px hsl(var(--primary) / 0.1)',
        'bento': '0 20px 40px -15px hsl(var(--primary) / 0.15)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [typography],
};

export default config;