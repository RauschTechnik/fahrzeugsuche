import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['var(--font-montserrat)']
      },
      fontSize: {
        xs: ['var(--text-size-xs)', { lineHeight: 'var(--text-line-height-xs)' }],
        sm: ['var(--text-size-sm)', { lineHeight: 'var(--text-line-height-sm)' }],
        base: ['var(--text-size-base)', { lineHeight: 'var(--text-line-height-base)' }],
        lg: ['var(--text-size-lg)', { lineHeight: 'var(--text-line-height-lg)' }],
        'lg-alt': ['var(--text-size-lg-alt)', { lineHeight: 'var(--text-line-height-lg-alt)' }],
        'lg-button': ['var(--text-size-lg-button)', { lineHeight: 'var(--text-line-height-lg-button)' }],
        xl: ['var(--text-size-xl)', { lineHeight: 'var(--text-line-height-xl)' }],
        '2xl': ['var(--text-size-2xl)', { lineHeight: 'var(--text-line-height-2xl)' }],
        '3xl': ['var(--text-size-3xl)', { lineHeight: 'var(--text-line-height-3xl)' }],
        '4xl': ['var(--text-size-4xl)', { lineHeight: 'var(--text-line-height-4xl)' }]
      },
      colors: {
        /* custom variables */
        key: {
          50: 'hsl(var(--key-50))',
          100: 'hsl(var(--key-100))',
          200: 'hsl(var(--key-200))',
          300: 'hsl(var(--key-300))',
          400: 'hsl(var(--key-400))',
          500: 'hsl(var(--key-500))',
          600: 'hsl(var(--key-600))',
          700: 'hsl(var(--key-700))',
          800: 'hsl(var(--key-800))',
          900: 'hsl(var(--key-900))'
        },
        /* shadcn variables */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: {
        DEFAULT: 'var(--box-shadow-medium)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
} satisfies Config;
