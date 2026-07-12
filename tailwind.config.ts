import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          amber: '#f59e0b',
          'amber-light': '#fbbf24',
          'amber-dark': '#d97706',
          emerald: '#10b981',
          'emerald-light': '#34d399',
          slate: {
            900: '#0f172a',
            800: '#1e293b',
            700: '#334155',
            600: '#475569',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
