import { Icon, type IconName } from '@/components/ui/Icon'

export type TabKey = 'home' | 'ration' | 'workout' | 'steps'

/** Заміри тіла свідомо не в таб-барі — вони живуть у Налаштуваннях. */
const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Головна', icon: 'home' },
  { key: 'ration', label: 'Раціон', icon: 'ration' },
  { key: 'workout', label: 'Вправи', icon: 'workout' },
  { key: 'steps', label: 'Кроки', icon: 'steps' },
]

export function TabBar({
  active,
  onChange,
}: {
  active: TabKey
  onChange: (tab: TabKey) => void
}) {
  return (
    <nav className="tabbar" aria-label="Основна навігація">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`tab${active === tab.key ? ' active' : ''}`}
          onClick={() => onChange(tab.key)}
          aria-current={active === tab.key ? 'page' : undefined}
        >
          <Icon name={tab.icon} />
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
