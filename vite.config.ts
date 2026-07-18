import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Сайт живе на піддомені https://balance.amosk.com.ua/ у корені —
// base лишається '/'. Якщо колись переїде в підтеку, міняти тут.
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    /*
     * У розробці /api віддає локальний PHP-сервер. Адресу можна перевизначити
     * через BALANCE_API_PROXY, щоб ходити на бойовий бекенд.
     */
    proxy: {
      '/api': {
        target: process.env.BALANCE_API_PROXY ?? 'http://127.0.0.1:8899',
        changeOrigin: true,
      },
    },
  },
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
