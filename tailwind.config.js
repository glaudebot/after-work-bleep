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
      },
      animation: { shake: 'shake 0.25s linear infinite' },
    },
  },
  plugins: [],
};
