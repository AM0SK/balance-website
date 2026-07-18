import { Icon } from '@/components/ui/Icon'
import { useStore } from '@/lib/store'

/** Шапка закріплена на кожному екрані: лого, аватар, шестерня. */
export function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { profile } = useStore()

  return (
    <header className="topbar">
      <div className="wordmark">Balance</div>
      <div className="right">
        {profile.photoUrl ? (
          <img className="avatar" src={profile.photoUrl} alt="" />
        ) : (
          <div className="avatar" />
        )}
        <button className="gearbtn" onClick={onOpenSettings} aria-label="Налаштування">
          <Icon name="gear" />
        </button>
      </div>
    </header>
  )
}
