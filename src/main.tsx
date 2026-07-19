import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ModalTuner } from '@/components/dev/ModalTuner'
import { StoreProvider } from '@/lib/store'
import { ThemeProvider } from '@/lib/theme'
import { initTelegram } from '@/lib/telegram'

import './styles/tokens.css'
import './styles/global.css'
import './styles/components.css'

initTelegram()

const root = document.getElementById('root')
if (!root) throw new Error('Не знайдено #root')

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <StoreProvider>
        <App />
        {/*
          Інструмент розробки, у бойову збірку не потрапляє. Стоїть тут,
          а не всередині App: App має окрему гілку рендера для екрана
          Налаштувань, і панель зникала б саме там, де живе модалка
          скидання прогресу.
        */}
        {import.meta.env.DEV && <ModalTuner />}
      </StoreProvider>
    </ThemeProvider>
  </StrictMode>,
)
