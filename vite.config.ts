import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // GitHub Pages 配信パス
  base: "/used-car-app/",
  plugins: [react(), tailwindcss()],
  server: {
    // 安定運用のためポート固定
    port: 3023,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 5179,
    strictPort: false,
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
});
