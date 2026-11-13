/** @type {import('tailwindcss').Config} */
// Tailwind v3 고정: v4 기본 팔레트는 oklch()라서 html2canvas 1.x가 파싱하지 못해 짤 캡처가 실패한다.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0)' },
          '25%': { transform: 'translate(-3px, 1px) rotate(-2deg)' },
          '75%': { transform: 'translate(3px, -1px) rotate(2deg)' },
        },
        swell: {
          '0%': { transform: 'scale(1) rotate(0)' },
          '25%': { transform: 'scale(1.08) rotate(-3deg)' },
          '50%': { transform: 'scale(1.16) rotate(3deg)' },
          '75%': { transform: 'scale(1.24) rotate(-3deg)' },
          '100%': { transform: 'scale(1.32) rotate(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        shake: 'shake 0.25s linear infinite',
        swell: 'swell 1s ease-in forwards',
        pop: 'pop 0.35s ease-out',
      },
    },
  },
  plugins: [],
};
