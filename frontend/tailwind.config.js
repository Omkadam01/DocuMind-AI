export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f9ff',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        surface: {
          900: '#060912',
          800: '#080d1a',
          700: '#0d1525',
          600: '#111e35',
          500: '#1a2844',
        },
        border: {
          DEFAULT: 'rgba(56,189,248,0.12)',
          hover:   'rgba(56,189,248,0.30)',
          active:  'rgba(56,189,248,0.55)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-up':   'fade-up 0.4s ease forwards',
        'shimmer':   'shimmer 1.5s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(52,211,153,0.5)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(52,211,153,0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
