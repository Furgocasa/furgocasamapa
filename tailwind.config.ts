import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Azul corporativo Furgocasa (#0b3c74) como color primario único
        primary: {
          50: '#eef4fb',
          100: '#d8e5f4',
          200: '#b3cce9',
          300: '#84aad9',
          400: '#4f83c4',
          500: '#2563a8',
          600: '#0b3c74',
          700: '#093261',
          800: '#08294f',
          900: '#061e3a',
        },
        // Naranja de acento (acciones, estados activos, favoritos)
        accent: {
          50: '#fff4ee',
          100: '#ffe6d9',
          200: '#ffc9ad',
          300: '#ffa477',
          400: '#ff8551',
          500: '#ff6b35',
          600: '#ea5620',
          700: '#c44317',
          800: '#9c3615',
          900: '#7e2f15',
        },
        // Colores semánticos por tipo de área (marcadores, badges, filtros)
        tipo: {
          publica: '#0284c7',
          privada: '#FF6B35',
          camping: '#52B788',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        heading: ['var(--font-outfit)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        // Dos niveles unificados: 'card' para superficies, 'overlay' para sheets/modales
        'card': '0 1px 3px rgba(15, 23, 42, 0.08), 0 2px 12px rgba(15, 23, 42, 0.06)',
        'overlay': '0 -8px 30px rgba(15, 23, 42, 0.18)',
        // Alias legacy (mismo valor que 'card') para no romper usos existentes
        'mobile': '0 1px 3px rgba(15, 23, 42, 0.08), 0 2px 12px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}
export default config
