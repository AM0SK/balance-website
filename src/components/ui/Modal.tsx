import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * Модалка-аркуш. Закривається по Esc і кліку по підложці.
 * Фокус переводиться всередину і повертається назад — інакше в мобільному
 * скрінрідері користувач лишається на кнопці під оверлеєм.
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const restoreFocusTo = useRef<Element | null>(null)

  useEffect(() => {
    restoreFocusTo.current = document.activeElement
    sheetRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // Фон не має скролитись під відкритою модалкою.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      ;(restoreFocusTo.current as HTMLElement | null)?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <button className="modal-close" onClick={onClose} aria-label="Закрити">
          <Icon name="close" strokeWidth={2.4} />
        </button>
        <h2 className="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
