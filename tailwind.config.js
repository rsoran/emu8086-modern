/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emu: {
          bg: '#0f141c',
          panel: '#151b26',
          card: '#1b2232',
          border: '#2a3449',
          accent: '#3b82f6',
          retro: '#00ff66',
          amber: '#ffb000'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        dos: ['"Fixedsys"', '"Courier New"', 'monospace']
      }
    },
  },
  plugins: [],
}
