/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#171717',
        body: '#4d4d4d',
        muted: '#888888',
        canvas: {
          DEFAULT: '#ffffff',
          soft: '#fafafa',
          'soft-2': '#f5f5f5',
        },
        hairline: {
          DEFAULT: '#ebebeb',
          strong: '#a1a1a1',
        },
        accent: {
          DEFAULT: '#0070f3',
          soft: '#d3e5ff',
        },
        success: {
          DEFAULT: '#00a67e',
          soft: '#d4f5e9',
        },
        warning: {
          DEFAULT: '#f5a623',
          soft: '#ffefcf',
        },
        error: {
          DEFAULT: '#ee0000',
          soft: '#f7d4d6',
        },
        link: {
          DEFAULT: '#0070f3',
          deep: '#0761d1',
          'bg-soft': '#d3e5ff',
        },
        violet: {
          DEFAULT: '#7928ca',
          soft: '#d8ccf1',
          100: '#d8ccf1',
          600: '#7928ca',
        },
        cyan: {
          DEFAULT: '#50e3c2',
          soft: '#aaffec',
          deep: '#29bc9b',
        },
        info: {
          DEFAULT: '#0070f3',
          soft: '#d3e5ff',
        },
        primary: {
          DEFAULT: '#171717',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        'pill-sm': '64px',
        pill: '100px',
        full: '9999px',
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        '3xl': '48px',
        '4xl': '64px',
        '5xl': '96px',
        '6xl': '128px',
        section: '192px',
      },
      boxShadow: {
        sm: 'inset 0 0 0 1px rgba(0,0,0,0.08), 0px 1px 1px rgba(0,0,0,0.05), 0px 2px 2px rgba(0,0,0,0.1)',
        md: 'inset 0 0 0 1px rgba(0,0,0,0.08), 0px 2px 2px rgba(0,0,0,0.1), 0px 8px 8px -8px rgba(0,0,0,0.1)',
        lg: 'inset 0 0 0 1px rgba(0,0,0,0.08), 0px 2px 2px rgba(0,0,0,0.1), 0px 8px 16px -4px rgba(0,0,0,0.1)',
        xl: 'inset 0 0 0 1px rgba(0,0,0,0.08), 0px 1px 1px rgba(0,0,0,0.05), 0px 8px 16px -4px rgba(0,0,0,0.1), 0px 24px 32px -8px rgba(0,0,0,0.15)',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 200ms ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
