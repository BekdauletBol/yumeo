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
          base: '#000000',
          surface: '#111111',
          elevated: '#1a1a1a',
          overlay: '#222222',
        },
        text: {
          primary: '#F0F0F0',
          secondary: '#888888',
          tertiary: '#555555',
          accent: '#E8611A',
        },
        border: {
          subtle: '#222222',
          default: '#333333',
          strong: '#444444',
        },
        accent: {
          primary: '#E8611A',
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
