/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // カスタムカラー - USS評価システム用
        appraisal: {
          DEFAULT: '#D9534F', // 鑑定書ボタン
          hover: '#C9443F',
        },
        invoice: {
          DEFAULT: '#007AFF', // 請求書ボタン
          hover: '#0066DD',
        },
        uss: {
          s: '#FFD700',      // S点（ゴールド）
          6: '#00A650',      // 6点（グリーン）
          5: '#4169E1',      // 5点（ロイヤルブルー）
          4.5: '#FF8C00',    // 4.5点（オレンジ）
          4: '#DC143C',      // 4点（クリムゾン）
          r: '#8B0000',      // R点（ダークレッド）
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
