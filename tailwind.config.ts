import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'custome-red': '#e10711',
        brand: {
          DEFAULT: '#e10711',
          hover: '#ff1a25',
          muted: 'rgba(225, 7, 17, 0.15)',
        },
        surface: {
          overlay: 'rgba(0, 0, 0, 0.6)',
          chip: 'rgba(255, 255, 255, 0.12)',
          chipHover: 'rgba(255, 255, 255, 0.2)',
        },
        ink: {
          primary: '#ffffff',
          secondary: 'rgba(255, 255, 255, 0.7)',
          disabled: 'rgba(255, 255, 255, 0.35)',
        },
      },
      boxShadow: {
        custom: 'rgba(0, 0, 0, 0.35) 0px 5px 15px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
