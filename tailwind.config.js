module.exports = {
  content: [
    "./src/**/*.{js,jsx}",
    "./public/**/*.html"
  ],
  corePlugins: {
    preflight: false, // Disable the CSS reset
  },
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#0E141A',
          800: '#141C24',
          700: '#1E293B',
          600: '#4B5563',
          500: '#6B7280',
          400: '#9CA3AF',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
        },
      },
    },
  },
  plugins: [],
}