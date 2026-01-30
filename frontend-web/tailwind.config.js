/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // GameVault Dark Theme Colors - Aurora Aero Style
        dark: {
          50: '#1e293b',
          100: '#0f172a',
          200: '#0a0e27',
          300: '#070a1a',
          400: '#050712',
          500: '#020617',
        },
        // Deep blue additions for Frutiger Aero
        aero: {
          50: '#e0f2fe',
          100: '#bae6fd',
          200: '#7dd3fc',
          300: '#38bdf8',
          400: '#0ea5e9',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
          950: '#041e36',
        },
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          pink: '#ec4899',
          orange: '#f59e0b',
          green: '#10b981',
          blue: '#3b82f6',
          red: '#ef4444',
          cyan: '#06b6d4',
          teal: '#14b8a6',
        },
        aurora: {
          green: '#22d3ee',
          blue: '#3b82f6',
          purple: '#a78bfa',
          pink: '#ec4899',
          teal: '#2dd4bf',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'aurora': 'aurora 15s ease-in-out infinite',
        'aurora-slow': 'aurora 25s ease-in-out infinite',
        'wave': 'wave 8s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 10s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        aurora: {
          '0%, 100%': {
            transform: 'translateX(0%) translateY(0%) rotate(0deg) scale(1)',
            opacity: '0.5'
          },
          '25%': {
            transform: 'translateX(5%) translateY(-5%) rotate(2deg) scale(1.05)',
            opacity: '0.7'
          },
          '50%': {
            transform: 'translateX(-5%) translateY(5%) rotate(-2deg) scale(1.1)',
            opacity: '0.6'
          },
          '75%': {
            transform: 'translateX(3%) translateY(-3%) rotate(1deg) scale(1.02)',
            opacity: '0.8'
          },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0) scaleY(1)' },
          '50%': { transform: 'translateY(-20px) scaleY(1.1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'gradient-aero': 'linear-gradient(135deg, #0c4a6e 0%, #1e293b 50%, #4c1d95 100%)',
        'gradient-aurora': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 25%, #8b5cf6 50%, #ec4899 75%, #22d3ee 100%)',
      },
    },
  },
  plugins: [],
}
