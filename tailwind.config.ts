import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#E07355',
          hov: '#C85E40',
          hover: '#C85E40',
          light: 'rgba(224,115,85,0.10)',
        },
        blue:   { DEFAULT: '#4A7FC1', bg: 'rgba(74,127,193,0.11)' },
        green:  { DEFAULT: '#5A9E72', bg: 'rgba(90,158,114,0.11)' },
        gold:   { DEFAULT: '#C49A3C', bg: 'rgba(196,154,60,0.11)' },
        red:    { DEFAULT: '#C0504A', bg: 'rgba(192,80,74,0.10)' },
        purple: { DEFAULT: '#9B6DD9', bg: 'rgba(155,109,217,0.11)' },
      },
      fontFamily: {
        sans:  ["'DM Sans'", 'system-ui', 'sans-serif'],
        serif: ["'Lora'", 'Georgia', 'serif'],
        mono:  ["'JetBrains Mono'", 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '14px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.10)',
        float: '0 8px 28px rgba(0,0,0,0.08)',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'fade-up':  'fadeUp 0.4s ease both',
        'pulse-slow': 'pulse 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
