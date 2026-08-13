import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useStore } from '@/lib/store'
import { useTour } from '@/lib/tour'

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
  const { hintVisible, dismissHint } = useTour()
  const gearRef = useRef<HTMLButtonElement>(null)

  /*
   * Останній крок навчання міг лишити екран прокрученим, а підказці
   * треба, щоб шестерня була на видноті. Вкладки не розмонтовуються,
   * тож шапок у дереві чотири — ховані пропускаємо.
   */
  useEffect(() => {
    const gear = gearRef.current
    if (!hintVisible || !gear || gear.getClientRects().length === 0) return
    gear.scrollIntoView({ block: 'nearest' })
  }, [hintVisible])

  return (
    <header className="topbar">
      <h1 className="pagetitle">{title}</h1>
      <div className="right">
        {profile.photoUrl ? (
          <img className="avatar" src={profile.photoUrl} alt="" />
        ) : (
          <div className="avatar" />
        )}
        <button
          className="gearbtn"
          onClick={onOpenSettings}
          aria-label="Налаштування"
          data-tour="settings"
          ref={gearRef}
        >
          <Icon name="gear" />
        </button>

        {/*
          Нагадування після навчання. Живе тут, поруч із кнопкою, а не
          шаром поверх екрана: інакше при скролі бульбашка лишалась би
          на місці, а кнопка їхала б від неї.
        */}
        {hintVisible && (
          <div className="tour-hint" role="status" onClick={dismissHint}>
            Гід по застосунку тут
          </div>
        )}
      </div>
    </header>
  )
}
