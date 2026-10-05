/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        osrs: {
          base: '#0F1015',
          surface: '#171922',
          elevated: '#1F2230',
          drawer: '#282C3F',
          gold: '#E5B842',
          'gold-light': '#F6D268',
          'gold-dark': '#B8860B',
          completed: '#10B981',
          progress: '#F59E0B',
          locked: '#6B7280',
          border: 'rgba(229, 184, 66, 0.15)',
          'border-active': '#E5B842',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(229, 184, 66, 0.25)',
        'gold-glow-lg': '0 0 25px rgba(229, 184, 66, 0.4)',
        'm3-elevation-1': '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
        'm3-elevation-2': '0 3px 6px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)',
        'm3-elevation-3': '0 10px 20px rgba(0,0,0,0.7), 0 3px 6px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
