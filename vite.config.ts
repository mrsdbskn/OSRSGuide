import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-vue-next')) {
              return 'vendor-icons';
            }
            if (id.includes('canvas-confetti')) {
              return 'vendor-confetti';
            }
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vendor-vue';
            }
          }
        }
      }
    }
  },
  server: {
    proxy: {
      '/api/wikisync': {
        target: 'https://sync.runescape.wiki',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wikisync/, '/runelite/player'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    }
  }
})
