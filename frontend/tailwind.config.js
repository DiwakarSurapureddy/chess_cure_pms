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
        'gold-glow-lg': '0 0 35px -5px rgba(229, 169, 60, 0.35)',
        'card-glow': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
      }
    },
  },
  plugins: [],
}
