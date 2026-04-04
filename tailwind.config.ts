import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        muted: 'hsl(var(--muted))',
        primary: 'hsl(var(--primary))',
      },
      boxShadow: {
        phone: '0 30px 70px rgba(0, 0, 0, 0.35)',
        /** Whole device (bezel + screen) lifted off page — no border needed */
        'phone-device':
          '0 28px 56px rgba(38, 35, 31, 0.28), 0 10px 24px rgba(38, 35, 31, 0.18), 0 2px 6px rgba(38, 35, 31, 0.12)',
        'screen-float':
          '0 28px 70px rgba(55, 48, 40, 0.2), 0 12px 32px rgba(55, 48, 40, 0.14), 0 4px 12px rgba(55, 48, 40, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;

