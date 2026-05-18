/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base:       'var(--color-base)',
        surface:    'var(--color-surface)',
        'surface-2':'var(--color-surface-2)',
        separator:  'var(--color-border)',
        'tx-main':  'var(--color-text-main)',
        'tx-muted': 'var(--color-text-muted)',
        'tx-subtle':'var(--color-text-subtle)',
        'input-bg': 'var(--color-input-bg)',
      },
    },
  },
  plugins: [],
};
