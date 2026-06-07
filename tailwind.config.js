/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0B0B0F', soft: '#131319', card: '#1A1A22' },
        fg: { DEFAULT: '#EDEDF2', mut: '#8B8C96', dim: '#4A4B55' },
      },
      fontFamily: { sans: ['"General Sans"','system-ui','sans-serif'], mono: ['"JetBrains Mono"','ui-monospace','monospace'] },
      maxWidth: { site: '1200px' },
    },
  },
  plugins: [],
};
