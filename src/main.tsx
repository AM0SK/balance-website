import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { StoreProvider } from '@/lib/store'
import { initTelegram } from '@/lib/telegram'

import './styles/tokens.css'
import './styles/global.css'
import './styles/components.css'

initTelegram()

const root = document.getElementById('root')
if (!root) throw new Error('Не знайдено #root')

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
