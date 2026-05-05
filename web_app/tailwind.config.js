/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: {
          50:  '#f7f6f2',
          100: '#ece9e0',
          200: '#d8d3c4',
          300: '#b8b1a0',
          400: '#8c8675',
          500: '#5d584c',
          600: '#3d3a32',
          700: '#26241f',
          800: '#16140f',
          900: '#0c0b08',
        },
        accent: {
          DEFAULT: '#d94f2c',
          ink:     '#a83a1d',
          soft:    '#f3a07a',
        },
        sage: '#516b56',
      },
      boxShadow: {
        soft: '0 1px 0 rgba(20,18,12,0.04), 0 8px 24px -12px rgba(20,18,12,0.12)',
      },
    },
  },
  plugins: [],
}
