import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'

/** Тривалість анімації виходу — має збігатись зі значенням у components.css (.is-closing). */
const EXIT_MS = 500

/**
 * Модалка-аркуш. Закривається по Esc і кліку по підложці.
 * Фокус переводиться всередину і повертається назад — інакше в мобільному
 * скрінрідері користувач лишається на кнопці під оверлеєм.
 *
 * onClose — «справжнє» розмонтування (парент прибирає модалку зі стану).
 * Викликається не одразу, а через EXIT_MS після початку анімації виходу:
 * без цієї затримки React прибрав би вузол із DOM раніше, ніж встигне
 * відіграти CSS-перехід.
 *
 * children — функція, що отримує `close`. Її мають викликати ВСІ шляхи
 * закриття зсередини — «Скасувати» і, найважливіше, успішне збереження.
 * Пряме звернення до onClose-проп прибрало б модалку з дерева миттєво,
 * без шансу на анімацію виходу.
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: (close: () => void) => ReactNode
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const restoreFocusTo = useRef<Element | null>(null)
  const prevOverflowRef = useRef('')
  const [closing, setClosing] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  const requestClose = useCallback(() => {
    setClosing((already) => {
      if (already) return already
      /*
       * Скрол і клікабельність сторінки під модалкою повертаються ОДРАЗУ,
       * не чекаючи EXIT_MS: підложка ще 500ms видима й з opacity-переходом,
       * але pointer-events:none у CSS (.is-closing) прибирає її з-під
       * дотиків негайно. Якби чекали повного розмонтування — сторінка під
       * блюром 500ms не реагувала б на скрол і тапи, що й виглядало як
       * «зависання» після підтвердження.
       */
      document.body.style.overflow = prevOverflowRef.current
      closeTimerRef.current = window.setTimeout(onClose, EXIT_MS)
      return true
    })
  }, [onClose])

  useEffect(() => {
    restoreFocusTo.current = document.activeElement
    sheetRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // Фон не має скролитись під відкритою модалкою.
    prevOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflowRef.current
      if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current)
      ;(restoreFocusTo.current as HTMLElement | null)?.focus?.()
    }
  }, [requestClose])

  return (
    <div
      className={`modal-overlay${closing ? ' is-closing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose()
      }}
    >
      <div
        className={`modal-sheet${closing ? ' is-closing' : ''}`}
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <button className="modal-close" onClick={requestClose} aria-label="Закрити">
          <Icon name="close" strokeWidth={2.4} />
        </button>
        <h2 className="modal-title">{title}</h2>
        {children(requestClose)}
      </div>
    </div>
  )
}
