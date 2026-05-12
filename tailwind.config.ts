import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          overlay: 'var(--bg-overlay)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          accent: 'var(--text-accent)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          default: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          refs: 'var(--accent-refs)',
          drafts: 'var(--accent-drafts)',
          figures: 'var(--accent-figures)',
          tables: 'var(--accent-tables)',
          template: 'var(--accent-template)',
          equations: 'var(--accent-equations)',
          diagrams: 'var(--accent-diagrams)',
        },
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
        },
      },
      fontFamily: {
        display: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        lg: '12px',
        xl: '12px',
        '2xl': '16px',
      },
      transitionDuration: {
        base: '200ms',
      },
      animation: {
        'cursor-blink': 'cursor-blink 500ms step-end infinite',
        'fade-in': 'fade-in 400ms ease-out',
        'slide-up': 'slide-up 400ms ease-out',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
