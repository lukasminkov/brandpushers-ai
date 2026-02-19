import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F24822',
          purple: '#9B0EE5',
          'orange-light': '#F57B18',
        },
        dark: {
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
          600: '#222222',
        }
      },
      backgroundImage: {
        'logo-gradient': 'linear-gradient(135deg, #9B0EE5, #F57B18)',
      }
    },
  },
  plugins: [],
} satisfies Config;
