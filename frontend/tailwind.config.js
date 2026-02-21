/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fef9ec',
          100: '#fef0c7',
          200: '#fde18a',
          300: '#fbcc4d',
          400: '#f9b124',
          500: '#f38f0a',
          600: '#d76a05',
          700: '#b24a08',
          800: '#913a0e',
          900: '#763010',
        },
      },
    },
  },
  plugins: [],
}
