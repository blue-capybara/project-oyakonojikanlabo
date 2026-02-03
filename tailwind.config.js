// tailwind.config.js
import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'line-seed': ['LINESeedJP', 'sans-serif'],
        'sans': ['LINESeedJP', 'sans-serif'],
      },
      colors: {
        primary: '#8CB9DD',
        secondary: '#B1D7EF',
        accent: '#579BB1',
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '0.925rem',
        'lg': '1.025rem',
        'xl': '1.125rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '1.875rem',
        '5xl': '2.25rem',
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        DEFAULT: '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
        'button': '8px',
      }
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        '.to-primary': {
          '--tw-gradient-to': '#8CB9DD var(--tw-gradient-to-position)',
        },
        '.from-primary': {
          '--tw-gradient-from': '#8CB9DD var(--tw-gradient-from-position)',
          '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to, rgba(140, 185, 221, 0))',
        },
        '.to-secondary': {
          '--tw-gradient-to': '#B1D7EF var(--tw-gradient-to-position)',
        },
        '.from-secondary': {
          '--tw-gradient-from': '#B1D7EF var(--tw-gradient-from-position)',
          '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to, rgba(177, 215, 239, 0))',
        },
        '.bg-primary\\/80': {
          'background-color': 'rgba(140, 185, 221, 0.8)',
        },
        '.text-primary': {
          color: '#8CB9DD',
        },
        '.border-primary': {
          borderColor: '#8CB9DD',
        },
      };
      addUtilities(newUtilities, ['responsive', 'hover']);
    }),
    require('@tailwindcss/typography'),
  ],
};
