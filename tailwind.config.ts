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
        surface: {
          DEFAULT: '#ffffff',
          muted: '#fbfaf8',
          inset: '#f4f3ef',
          page: '#f6f5f2',
        },
        line: {
          DEFAULT: '#e9e7e1',
          strong: '#ddd9d1',
        },
        ink: {
          DEFAULT: '#1c1b18',
          2: '#57564f',
          3: '#8c8a80',
          4: '#a8a69b',
        },
        brand: {
          DEFAULT: '#059669',
          hover: '#047857',
          press: '#036249',
          soft: '#ecfdf5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Instrument Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(28, 27, 24, 0.05)',
        soft: '0 1px 3px rgba(28, 27, 24, 0.06), 0 1px 2px rgba(28, 27, 24, 0.04)',
        card: '0 4px 12px -2px rgba(28, 27, 24, 0.08), 0 2px 6px -2px rgba(28, 27, 24, 0.05)',
        lift: '0 12px 32px -8px rgba(28, 27, 24, 0.14), 0 4px 12px -4px rgba(28, 27, 24, 0.08)',
      },
      borderRadius: {
        card: '16px',
        control: '12px',
      },
    },
  },
  plugins: [],
}

export default config
