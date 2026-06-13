/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // keep for safety
  ],
  theme: {
    extend: {
      colors: {
        landing: {
          surface: 'rgba(255,255,255,0.10)',
          'surface-hover': 'rgba(255,255,255,0.16)',
          border: 'rgba(255,255,255,0.10)',
          'border-strong': 'rgba(255,255,255,0.20)',
          text: 'rgba(255,255,255,0.80)',
          'text-muted': 'rgba(255,255,255,0.60)',
        },
        gold: {
          50: '#FBF7E8',
          100: '#F5EDD1',
          200: '#EBDBA3',
          300: '#E0C875',
          400: '#D9B847',
          DEFAULT: '#D4AF37',
          600: '#C4942A',
          700: '#B0791D',
          800: '#8F5E14',
          900: '#6F460A',
        },
        brand: {
          bg:      '#07070A',
          surface: '#0E1116',
          surface2:'#161B22',
          surface3:'#1D2028',
          border:  '#1E2530',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        // Existing
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'slide-up':  'slideUp 0.4s ease forwards',

        // Premium animations
        'float': 'float 3s ease-in-out infinite',
        'float-delayed': 'float 3s ease-in-out 0.5s infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'rotate-slow': 'rotate 20s linear infinite',
        'scale-pulse': 'scalePulse 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'slide-in-right': 'slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-in-left': 'slideInLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'reveal-text': 'revealText 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowPulse: {
          '0%, 100%': {
            opacity: '0.5',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.15)',
          },
          '50%': {
            opacity: '1',
            boxShadow: '0 0 40px rgba(212, 175, 55, 0.3)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        scalePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        revealText: {
          from: { opacity: '0', filter: 'blur(10px)' },
          to: { opacity: '1', filter: 'blur(0)' },
        },
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        snappy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        luxe: 'cubic-bezier(0.43, 0.13, 0.23, 0.96)',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.15)',
        'gold-glow-lg': '0 0 40px rgba(212, 175, 55, 0.25)',
        'emerald-glow': '0 0 20px rgba(16, 185, 129, 0.15)',
        'blue-glow': '0 0 20px rgba(59, 130, 246, 0.15)',
      },
      backdropFilter: {
        'blur-sm': 'blur(4px)',
        'blur-md': 'blur(12px)',
        'blur-lg': 'blur(20px)',
      },
    },
  },
  plugins: [],
}
