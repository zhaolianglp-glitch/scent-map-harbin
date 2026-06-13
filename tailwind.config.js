/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Smiley Sans"', 'sans-serif'],
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: 'oklch(0.25 0.02 240)',
        paper: 'oklch(0.97 0.01 80)',
        mist: 'oklch(0.92 0.005 80)',
      },
    },
  },
  plugins: [],
};
