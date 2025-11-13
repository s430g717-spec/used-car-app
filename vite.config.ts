import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/used-car-app/',
  plugins: [react()],
  build: {
    outDir: 'docs'
  }
});
