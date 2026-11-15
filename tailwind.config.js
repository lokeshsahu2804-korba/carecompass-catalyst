/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        elderly: {
          bg: "#0B132B",
          card: "#1C2541",
          border: "#3A506B",
          accent: "#5BC0BE",
          text: "#FFFFFF",
          muted: "#D1D5DB",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
      },
      fontSize: {
        'elderly-sm': ['1.125rem', { lineHeight: '1.75rem' }],
        'elderly-base': ['1.375rem', { lineHeight: '2rem' }],
        'elderly-lg': ['1.75rem', { lineHeight: '2.25rem' }],
        'elderly-xl': ['2.25rem', { lineHeight: '2.75rem' }],
        'elderly-2xl': ['3rem', { lineHeight: '3.5rem' }],
      },
      minHeight: {
        'touch': '56px',
        'touch-lg': '72px',
      },
      minWidth: {
        'touch': '56px',
        'touch-lg': '72px',
      },
    },
  },
  plugins: [],
}

