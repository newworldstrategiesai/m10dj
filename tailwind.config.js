const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        'neon-cyan': '#00ffff',
        'neon-purple': '#8b5cf6',
        'neon-pink': '#ff00ff',
        'neon-green': '#00ff41',
        'cyber-dark': '#0a0a0f',
        'cyber-surface': '#1a1a2e',
        'cyber-border': '#16213e',
        'glass': {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)'
        }
      },
      fontFamily: {
        sans: ['Rajdhani', ...fontFamily.sans],
        mono: ['Orbitron', ...fontFamily.mono],
        orbitron: ['Orbitron', 'monospace'],
        rajdhani: ['Rajdhani', 'sans-serif']
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        'neon-gradient': 'linear-gradient(45deg, #00ffff, #8b5cf6, #ff00ff)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.3)',
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'neon-pink': '0 0 20px rgba(255, 0, 255, 0.3)',
        'cyber': '0 20px 40px rgba(0, 255, 255, 0.2), 0 0 0 1px rgba(0, 255, 255, 0.3)'
      },
      animation: {
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'neon-flicker': 'neon-flicker 2s ease-in-out infinite alternate',
        'cyber-grid': 'grid-move 20s linear infinite',
        'hologram': 'hologram-scan 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'rotate-slow': 'rotate 20s linear infinite'
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        },
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        'grid-move': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(50px, 50px)' }
        },
        'hologram-scan': {
          '0%': { 'background-position': '0 0' },
          '100%': { 'background-position': '20px 20px' }
        },
        'float': {
          '0%, 100%': { 
            transform: 'translateY(0px) translateX(0px)',
            opacity: '0'
          },
          '10%, 90%': {
            opacity: '1'
          },
          '50%': { 
            transform: 'translateY(-20px) translateX(10px)'
          }
        },
        'rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      },
      clipPath: {
        'cyber': 'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)',
        'cyber-small': 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)'
      }
    }
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addUtilities }) {
      const newUtilities = {
        '.clip-cyber': {
          'clip-path': 'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)'
        },
        '.clip-cyber-small': {
          'clip-path': 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)'
        }
      }
      addUtilities(newUtilities)
    }
  ]
};
