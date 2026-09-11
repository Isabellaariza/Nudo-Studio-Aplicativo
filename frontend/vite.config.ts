import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Raíz del proyecto frontend (index.html está aquí)
  root: __dirname,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — siempre necesario, chunk pequeño y cacheable
          'vendor-react': ['react', 'react-dom'],
          // Animaciones — lazy, solo se descarga al navegar
          'vendor-motion': ['motion'],
          // Íonos — tree-shaken por Vite, chunk separado y cacheable
          'vendor-lucide': ['lucide-react'],
        },
      },
    },
  },
})
