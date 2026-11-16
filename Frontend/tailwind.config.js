/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#031716',
        deep: '#032F30',
        primary: {
          DEFAULT: '#0A7075',
          dark: '#032F30',
          light: '#E6F4F5',
        },
        bright: '#0C969C',
        sky: '#6BA3BE',
        steel: '#274D60',
        surface: '#F2F7F8',
        border: '#D5E3E6',
        accent: '#E3A008',
        success: '#1F9D6B',
        danger: '#D64545',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(3, 23, 22, 0.08), 0 1px 2px rgba(3, 23, 22, 0.06)',
        card: '0 2px 8px rgba(3, 23, 22, 0.08), 0 1px 3px rgba(3, 23, 22, 0.06)',
        elevated: '0 4px 16px rgba(3, 23, 22, 0.10), 0 2px 4px rgba(3, 23, 22, 0.06)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        glow: '0 0 25px rgba(12, 150, 156, 0.35)',
        glowSm: '0 0 12px rgba(12, 150, 156, 0.4)',
      },
      animation: {
        'float': 'float 20s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
