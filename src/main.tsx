import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { TourLayer } from '@/components/onboarding/TourLayer'
import { StoreProvider } from '@/lib/store'
import { ThemeProvider } from '@/lib/theme'
import { TourProvider } from '@/lib/tour'
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
        <TourProvider>
          <App />
          {/*
            Оверлей навчання стоїть поруч з App, а не всередині: App має
            окрему гілку рендера для екрана Налаштувань, і підсвітка
            зникала б рівно на тих кроках, які показують саме його.
          */}
          <TourLayer />
        </TourProvider>
      </StoreProvider>
    </ThemeProvider>
  </StrictMode>,
)
