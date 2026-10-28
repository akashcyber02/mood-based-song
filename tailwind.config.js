/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Cabinet Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#080B10',
          card: 'rgba(18, 24, 38, 0.72)',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#FF3366',
          happy: '#FFD166',
          sad: '#118AB2',
          relaxed: '#06D6A0',
          energetic: '#EF476F',
          focus: '#8338EC',
          angry: '#E63946',
        }
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
