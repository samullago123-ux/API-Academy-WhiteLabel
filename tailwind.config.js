/** @type {import('tailwindcss').Config} */
const rgb = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        zinc: {
          50: rgb('zinc-50'),
          100: rgb('zinc-100'),
          200: rgb('zinc-200'),
          300: rgb('zinc-300'),
          400: rgb('zinc-400'),
          500: rgb('zinc-500'),
          600: rgb('zinc-600'),
          700: rgb('zinc-700'),
          800: rgb('zinc-800'),
          900: rgb('zinc-900'),
          950: rgb('zinc-950'),
        },
        indigo: { 200: rgb('indigo-200'), 300: rgb('indigo-300'), 400: rgb('indigo-400'), 500: rgb('indigo-500') },
        sky: { 200: rgb('sky-200'), 300: rgb('sky-300'), 400: rgb('sky-400'), 500: rgb('sky-500') },
        emerald: { 200: rgb('emerald-200'), 300: rgb('emerald-300'), 400: rgb('emerald-400'), 500: rgb('emerald-500') },
        amber: { 200: rgb('amber-200'), 300: rgb('amber-300'), 400: rgb('amber-400'), 500: rgb('amber-500') },
        red: { 200: rgb('red-200'), 300: rgb('red-300'), 400: rgb('red-400'), 500: rgb('red-500') },
        violet: { 200: rgb('violet-200'), 300: rgb('violet-300'), 400: rgb('violet-400'), 500: rgb('violet-500') },
        fuchsia: { 200: rgb('fuchsia-200'), 300: rgb('fuchsia-300'), 400: rgb('fuchsia-400'), 500: rgb('fuchsia-500') },
        pink: { 200: rgb('pink-200'), 300: rgb('pink-300'), 400: rgb('pink-400'), 500: rgb('pink-500') },
        cyan: { 200: rgb('cyan-200'), 300: rgb('cyan-300'), 400: rgb('cyan-400'), 500: rgb('cyan-500') },
        orange: { 200: rgb('orange-200'), 300: rgb('orange-300'), 400: rgb('orange-400'), 500: rgb('orange-500') },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
