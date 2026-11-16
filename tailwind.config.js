/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#121214',
          header: '#18181b',
          panel: '#1e1e24',
          subpanel: '#151518',
          border: '#27272a',
          hover: '#2a2a30',
          active: '#33333d',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          success: '#22c55e',
          warning: '#eab308',
          danger: '#ef4444',
          text: '#f4f4f5',
          textMuted: '#9ca3af'
        }
      },
      fontFamily: {
        mono: ['"SF Mono"', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
