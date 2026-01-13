import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';

// Read version from package.json (single source of truth)
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const appVersion = packageJson.version;

export default defineConfig({
  plugins: [react()],
  define: {
    // Make version available globally at build time
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  base: './',
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'mapbox-gl': 'mapbox-gl',
    },
    extensions: ['.js', '.jsx', '.json', '.geojson']
  },
  assetsInclude: ['**/*.geojson'],
  optimizeDeps: {
    include: ['mapbox-gl']
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          deck: ['deck.gl', '@deck.gl/core', '@deck.gl/layers', '@deck.gl/react'],
        },
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      },
    },
  },
}); 