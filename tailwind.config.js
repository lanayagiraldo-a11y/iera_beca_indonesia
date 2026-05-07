/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ─── iERA BRAND PALETTE ────────────────────────────────
        // Source: https://latin.iera.org logo (extracted from PNG)
        // Primary: BLACK · Accents: 4-color diamond (cyan, green, yellow, magenta)
        iera: {
          // Greys/black scale (primary brand)
          50:  '#FAFAFA',
          100: '#F1F1F1',
          200: '#D9D9D9',
          300: '#9E9E9E',
          400: '#404040',
          500: '#0A0A0A', // ← primary brand black
          600: '#000000',
          700: '#000000',
          800: '#000000',
          900: '#000000',

          // 4 accent colors from the diamond logo
          yellow: '#F5C518',
          green:  '#8FC93A',
          pink:   '#D60C8C', // magenta
          cyan:   '#1AA3DE'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
