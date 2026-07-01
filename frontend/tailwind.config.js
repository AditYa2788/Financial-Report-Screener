/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#05080f',
          900: '#0d1117',
          800: '#161b26',
          700: '#1e2535',
          600: '#263047'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace']
      }
    }
  },
  plugins: []
};
