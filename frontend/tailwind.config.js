/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          bg: '#080c14',
          surface: '#0d1524',
          card: '#111a2d',
          cardBorder: '#1c2a44',
          activeBorder: '#e5a93c',
          gold: '#e5a93c',
          goldHover: '#f5b94e',
          textMuted: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(229, 169, 60, 0.25)',
        'gold-glow-lg': '0 0 35px -5px rgba(229, 169, 60, 0.45)',
        'card-glow': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
        'input-glow': '0 0 15px rgba(229, 169, 60, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
