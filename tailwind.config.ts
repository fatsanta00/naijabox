import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/boxes/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Authentic Nigerian Green Scale
        brand: {
          50: '#e8f7ee',
          100: '#c8ecd4',
          200: '#99dab3',
          300: '#5ec28c',
          400: '#22a768',
          500: '#008751', // Official Nigerian Flag Green
          600: '#007344',
          700: '#005d37',
          800: '#00482b',
          900: '#003721',
          950: '#002013',
        },
        naija: {
          ink: 'var(--bg-ink)',
          surface: 'var(--bg-surface)',
          card: 'var(--bg-card)',
          cardSubtle: 'var(--bg-card-subtle)',
          muted: 'var(--text-muted)',
          border: 'var(--border-color)',
          text: 'var(--text-main)',
          green: '#008751',
          greenLight: '#22a768',
          greenDark: '#005d37',
          yellow: '#eab308',
          purple: '#7c3aed',
          teal: '#0d9488',
          coral: '#e11d48',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};

export default config;
