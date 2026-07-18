import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Сайт живе на піддомені https://balance.amosk.com.ua/ у корені —
// base лишається '/'. Якщо колись переїде в підтеку, міняти тут.
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    // Hostia — звичайний shared-хостинг, без HTTP/2 push і без бандл-аналітики.
    // Один вендорний чанк дешевше за багато дрібних запитів.
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom'] },
      },
    },
  },
})
