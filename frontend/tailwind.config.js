/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#12172c',
          900: '#171e3a',
          800: '#1f2848',
          700: '#2a3560',
        },
        brand: {
          50: '#eef1ff',
          100: '#e0e4ff',
          400: '#7b7ff0',
          500: '#5457d9',
          600: '#4547c2',
          700: '#3739a0',
        },
        leaf: {
          50: '#eefbf1',
          100: '#d7f5df',
          500: '#2fae5c',
          600: '#23904a',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(23, 30, 58, 0.06), 0 1px 3px 0 rgba(23, 30, 58, 0.08)',
      },
    },
  },
  plugins: [],
}
