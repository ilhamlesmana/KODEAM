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
        midnight: {
          950: '#05070b',
          900: '#090d16',
          800: '#0f172a',
          700: '#15203b',
          600: '#1e293b',
        },
        navy: {
          900: '#0c1322',
          800: '#111c34',
          700: '#172545',
          600: '#1e3059',
        },
        electric: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        marhas: {
          blue: '#1d4ed8',
          sky: '#0284c7',
          yellow: '#facc15',
          amber: '#f59e0b',
          emerald: '#10b981',
          coral: '#f97316',
          cream: '#faf8f5',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(14, 165, 233, 0.3)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.3)',
        'tactile': '0 6px 0 0 #0f172a',
        'tactile-sm': '0 4px 0 0 #0f172a',
        'tactile-blue': '0 6px 0 0 #1e3a8a',
      }
    },
  },
  plugins: [],
}
