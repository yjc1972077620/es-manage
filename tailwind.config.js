/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kibana 风格配色
        'kibana-blue': '#006BB4',
        'kibana-dark': '#1D1E24',
        'kibana-gray': '#343741',
        'kibana-light': '#F5F7FA',
        'kibana-border': '#D3DAE6',
        'status-green': '#017D73',
        'status-yellow': '#F5A700',
        'status-red': '#BD271E',
      }
    },
  },
  plugins: [],
}
