import { useEffect, useState } from 'react'
import { TabBar, type TabKey } from '@/components/layout/TabBar'
import { TopBar } from '@/components/layout/TopBar'
import { HomeScreen } from '@/screens/HomeScreen'
import { RationScreen } from '@/screens/RationScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { StepsScreen } from '@/screens/StepsScreen'
import { WorkoutScreen } from '@/screens/WorkoutScreen'
import { useStore } from '@/lib/store'
import { ScreenActivationContext } from '@/lib/screenActivation'

const TITLES: Record<TabKey, string> = {
  home: 'Головна',
  ration: 'Раціон',
  workout: 'Вправи',
  steps: 'Кроки',
}

const NO_ACTIVATIONS: Record<TabKey, number> = { home: 0, ration: 0, workout: 0, steps: 0 }

export function App() {
  const [tab, setTab] = useState<TabKey>('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { status, errorMessage, retry } = useStore()

  /*
   * Скільки разів заходили в кожну вкладку. Вкладки не розмонтовуються
   * при перемиканні (щоб кільця не губили стан анімації), тож графікам
   * потрібен окремий сигнал «ми знову на цьому екрані», аби відіграти
   * зростання стовпчиків заново.
   */
  const [activations, setActivations] = useState(NO_ACTIVATIONS)
  useEffect(() => {
    setActivations((prev) => ({ ...prev, [tab]: prev[tab] + 1 }))
  }, [tab])

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

      {/*
        Усі чотири вкладки тримаються змонтованими одночасно, видимість
        перемикається через CSS (display), а не умовним рендером. Інакше
        неактивна вкладка розмонтовувалась би повністю — досить було
        перейти з Раціону на Головну, і кільце прогресу на Головній
        втрачало б стан анімації, монтуючись заново вже з кінцевим
        значенням. Кожна вкладка — власний скрол-контейнер із власною
        шапкою: заголовок їде разом із контентом.
      */}
      {(Object.keys(TITLES) as TabKey[]).map((key) => (
        <ScreenActivationContext.Provider key={key} value={activations[key]}>
          <main className="stack" style={{ display: tab === key ? 'flex' : 'none' }}>
            <TopBar title={TITLES[key]} onOpenSettings={() => setSettingsOpen(true)} />
            {key === 'home' && <HomeScreen onOpenTab={setTab} />}
            {key === 'ration' && <RationScreen />}
            {key === 'workout' && <WorkoutScreen />}
            {key === 'steps' && <StepsScreen />}
          </main>
        </ScreenActivationContext.Provider>
      ))}

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
