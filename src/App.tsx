import { useState } from 'react'
import { TabBar, type TabKey } from '@/components/layout/TabBar'
import { TopBar } from '@/components/layout/TopBar'
import { HomeScreen } from '@/screens/HomeScreen'
import { RationScreen } from '@/screens/RationScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { StepsScreen } from '@/screens/StepsScreen'
import { WorkoutScreen } from '@/screens/WorkoutScreen'
import { useStore } from '@/lib/store'

const TITLES: Record<TabKey, string> = {
  home: 'Головна',
  ration: 'Раціон',
  workout: 'Вправи',
  steps: 'Кроки',
}

export function App() {
  const [tab, setTab] = useState<TabKey>('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { status, errorMessage, retry } = useStore()

  if (status === 'loading') {
    return (
      <div className="app">
        <div className="screen-message">
          <p>Завантаження…</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="app">
        <div className="screen-message">
          <h1 className="pagetitle">Не вдалося завантажити</h1>
          <p>{errorMessage}</p>
          <p className="hint">
            Застосунок відкривається через бота в Telegram. Якщо ви перейшли за посиланням
            у браузері — авторизації немає.
          </p>
          <button className="btn btn-grad" onClick={retry}>
            Спробувати ще раз
          </button>
        </div>
      </div>
    )
  }

  // Налаштування — окремий екран поверх усього, тому без таб-бару.
  if (settingsOpen) {
    return (
      <div className="app">
        {status === 'mock' && <MockBanner />}
        <SettingsScreen onClose={() => setSettingsOpen(false)} />
      </div>
    )
  }

  return (
    <div className="app">
      {status === 'mock' && <MockBanner />}

      {/* Шапка їде разом із контентом — вона всередині зони прокрутки. */}
      <main className="stack">
        <TopBar title={TITLES[tab]} onOpenSettings={() => setSettingsOpen(true)} />
        {tab === 'home' && <HomeScreen onOpenTab={setTab} />}
        {tab === 'ration' && <RationScreen />}
        {tab === 'workout' && <WorkoutScreen />}
        {tab === 'steps' && <StepsScreen />}
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

/**
 * Видима позначка, що бекенду немає і дані несправжні.
 * Без неї легко переплутати заглушку зі збереженими даними.
 */
function MockBanner() {
  return (
    <div className="mock-banner" role="status">
      Демодані — бекенд недоступний, зміни не зберігаються
    </div>
  )
}
