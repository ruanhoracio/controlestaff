/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      // Sombras do design system (DESIGN-SYSTEM.md): difusa externa + linha branca interna
      boxShadow: {
        card: '0 10px 28px -18px rgba(15,23,42,0.24), inset 0 1px 0 white',
        glass: '0 14px 38px -22px rgba(15,23,42,0.42), inset 0 1px 0 rgba(255,255,255,1)',
        raised: '0 18px 38px -20px rgba(15,23,42,0.45), inset 0 1px 0 white',
        btn: '0 10px 24px rgba(59,130,246,0.26), inset 0 1px 0 rgba(255,255,255,0.35)',
        control: '0 1px 2px rgba(15,23,42,0.04), inset 0 1px 0 white',
      },
    },
  },
  plugins: [],
}
