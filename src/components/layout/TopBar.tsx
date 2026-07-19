import { Icon } from '@/components/ui/Icon'
import { useStore } from '@/lib/store'

/**
 * Шапка екрана. На місці логотипа — заголовок поточного екрана;
 * сам логотип прибрано, бо назву застосунку показує Telegram.
 */
export function TopBar({
  title,
  onOpenSettings,
}: {
  title: string
  onOpenSettings: () => void
}) {
  const { profile } = useStore()

  return (
    <header className="topbar">
      <h1 className="pagetitle">{title}</h1>
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
