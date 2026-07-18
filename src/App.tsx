import { useState } from 'react'
import { TabBar, type TabKey } from '@/components/layout/TabBar'
import { TopBar } from '@/components/layout/TopBar'
import { HomeScreen } from '@/screens/HomeScreen'
import { RationScreen } from '@/screens/RationScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { StepsScreen } from '@/screens/StepsScreen'
import { WorkoutScreen } from '@/screens/WorkoutScreen'

export function App() {
  const [tab, setTab] = useState<TabKey>('home')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Налаштування — окремий екран поверх усього, тому без таб-бару.
  if (settingsOpen) {
    return (
      <div className="app">
        <SettingsScreen onClose={() => setSettingsOpen(false)} />
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />

      {/*
        Заголовок H1 і «+ Додати» свідомо всередині зони прокрутки:
        закріплена лише шапка.
      */}
      <main className="stack">
        {tab === 'home' && <HomeScreen onOpenTab={setTab} />}
        {tab === 'ration' && <RationScreen />}
        {tab === 'workout' && <WorkoutScreen />}
        {tab === 'steps' && <StepsScreen />}
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
