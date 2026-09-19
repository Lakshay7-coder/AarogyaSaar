/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ayur: {
          50: '#f4fbf7',
          100: '#e6f7ef',
          200: '#c5eedb',
          300: '#94e0c0',
          400: '#5bcb9e',
          500: '#2fb280',
          600: '#229068',
          700: '#1d7355',
          800: '#1a5c45',
          900: '#164c3a',
        },
        clinical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
