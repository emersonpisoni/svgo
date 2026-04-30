import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// Build SEM SVGO — apenas converte SVG para componente React, sem otimizar
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        plugins: ['@svgr/plugin-jsx'],
      },
      include: '**/*.svg?react',
    }),
  ],
});