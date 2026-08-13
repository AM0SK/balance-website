import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useTour } from '@/lib/tour'

/**
 * Малює навчання: затемнює екран, лишає «вікно» над потрібним елементом
 * і кладе поруч картку з поясненням. Стан веде lib/tour.tsx, сцени
 * (вкладка / екран Налаштувань) перемикає App.
 *
 * Ціль знаходимо за атрибутом data-tour у розмітці, а не за класами:
 * клас можна перейменувати під час верстки й мовчки зламати навчання.
 */

interface Anchor {
  top: number
  left: number
  width: number
  height: number
  radius: string
}

/** Повітря навколо підсвіченого елемента. */
const PAD = 8
/** Відстань від рамки підсвітки до картки з текстом. */
const GAP = 14
/** Скільки місця треба картці з поясненням, щоб стати збоку від підсвітки. */
const CARD_ROOM = 210
/** Куди підтягуємо ціль, коли доводиться прокручувати екран. */
const TOP_MARGIN = 76

function visibleTargets(target: string | string[]): HTMLElement[] {
  const names = Array.isArray(target) ? target : [target]
  return names.flatMap((name) =>
    Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)).filter(
      // Вкладки не розмонтовуються, а ховаються через display:none —
      // у прихованої копії немає прямокутників, лишаємо тільки видиму.
      (el) => el.getClientRects().length > 0,
    ),
  )
}

/** Спільна рамка для однієї або кількох сусідніх цілей. */
function boundingBox(els: HTMLElement[]): Anchor {
  const rects = els.map((el) => el.getBoundingClientRect())
  const top = Math.min(...rects.map((r) => r.top))
  const left = Math.min(...rects.map((r) => r.left))
  const right = Math.max(...rects.map((r) => r.right))
  const bottom = Math.max(...rects.map((r) => r.bottom))

  // У рядків і кнопок табів радіуса немає — прямі кути навколо підсвітки
  // виглядають чужими в інтерфейсі, де все скруглене. Відсотки (кругла
  // шестерня) лишаємо як є.
  const raw = getComputedStyle(els[0]).borderRadius
  const radius = raw.includes('%') ? raw : `${Math.max(parseFloat(raw) || 0, 14)}px`

  return { top, left, width: right - left, height: bottom - top, radius }
}

function insideFixed(el: HTMLElement): boolean {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (getComputedStyle(node).position === 'fixed') return true
  }
  return false
}

/** Найближчий предок, який справді скролиться — у застосунку це .stack. */
function scrollableParent(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node
    }
  }
  return null
}

const roomBelow = (box: Anchor): number =>
  window.innerHeight - (box.top + box.height + PAD + GAP)
const roomAbove = (box: Anchor): number => box.top - PAD - GAP

/**
 * Скільки сусідніх цілей реально підсвічувати. Крок про Головну просить
 * три картки, але на невисокому екрані вони з'їдають усе місце й
 * поясненню нема куди стати — воно лягає просто поверх підсвітки.
 * Тому беремо згори стільки, скільки лишає місце картці з текстом.
 */
function fitTargets(els: HTMLElement[]): HTMLElement[] {
  if (els.length < 2) return els

  const maxHeight = window.innerHeight - CARD_ROOM - TOP_MARGIN - GAP - PAD * 2
  const sorted = [...els].sort(
    (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
  )

  const kept = [sorted[0]]
  for (const el of sorted.slice(1)) {
    if (boundingBox([...kept, el]).height > maxHeight) break
    kept.push(el)
  }
  return kept
}

/**
 * Прямокутник цілі. Поки сцена перемикається, цілі ще немає в DOM —
 * чекаємо її по кадрах, а не одноразовою спробою.
 */
function useAnchor(target: string | string[] | undefined, active: boolean): Anchor | null {
  const [anchor, setAnchor] = useState<Anchor | null>(null)

  useEffect(() => {
    if (!active || !target) {
      setAnchor(null)
      return
    }

    let raf = 0
    let attempts = 0

    const tick = () => {
      const found = visibleTargets(target)
      if (found.length) {
        const els = fitTargets(found)
        const box = boundingBox(els)
        const offscreen = box.top < 70 || box.top + box.height > window.innerHeight - 110
        // Висока ціль (кілька карток) може стояти на екрані повністю, але
        // не лишати місця поясненню — тоді теж підтягуємо її вгору.
        const cramped = roomBelow(box) < CARD_ROOM && roomAbove(box) < CARD_ROOM
        // Елемент у fixed-контейнері (таб-бар) уже на екрані — скрол
        // лише смикнув би вміст під ним.
        if ((offscreen || cramped) && !insideFixed(els[0])) {
          const scroller = scrollableParent(els[0])
          // Ціль стає під шапку, картка з поясненням — під неї.
          if (scroller) scroller.scrollTop += box.top - TOP_MARGIN
        }
        setAnchor(boundingBox(els))
        return
      }
      // ~1.5 с очікування: якщо цілі так і немає, картка стане по центру.
      if (attempts++ < 90) raf = requestAnimationFrame(tick)
      else setAnchor(null)
    }
    tick()

    const remeasure = () => {
      const found = visibleTargets(target)
      // Разом із висотою екрана міняється і те, скільки цілей туди влазить.
      if (found.length) setAnchor(boundingBox(fitTargets(found)))
    }
    window.addEventListener('resize', remeasure)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', remeasure)
    }
  }, [target, active])

  return anchor
}

export function TourLayer() {
  return (
    <>
      <TourOverlay />
      <TourHint />
    </>
  )
}

function TourOverlay() {
  const { step, index, total, isLast, next, back, stop } = useTour()
  const anchor = useAnchor(step?.target, step !== null)

  if (!step) return null

  /*
   * Картка стає під підсвіткою, а якщо там не влазить — над нею. Рішення
   * за вільним місцем, а не за половиною екрана: висока ціль лишає під
   * собою кілька пікселів, і картка поїхала б за межі екрана.
   * Не влазить ніде (ціль майже на весь екран) — кладемо по центру.
   */
  const place = !anchor
    ? 'center'
    : roomBelow(anchor) >= CARD_ROOM
      ? 'below'
      : roomAbove(anchor) >= CARD_ROOM
        ? 'above'
        : 'center'

  const cardStyle =
    place === 'below'
      ? { top: anchor!.top + anchor!.height + PAD + GAP }
      : place === 'above'
        ? { bottom: window.innerHeight - anchor!.top + PAD + GAP }
        : undefined

  return (
    <div className={`tour-overlay${anchor ? '' : ' is-center'}`}>
      {anchor && (
        <div
          className="tour-hole"
          style={{
            top: anchor.top - PAD,
            left: anchor.left - PAD,
            width: anchor.width + PAD * 2,
            height: anchor.height + PAD * 2,
            borderRadius: anchor.radius,
          }}
        />
      )}

      <div
        className={`tour-card place-${place}`}
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        <button className="tour-close" onClick={stop} aria-label="Пропустити навчання">
          <Icon name="close" strokeWidth={2.4} />
        </button>

        <div className="tour-step num">
          Крок {index + 1} з {total}
        </div>
        <h2 className="tour-title" id="tour-title">
          {step.title}
        </h2>
        <p className="tour-body">{step.body}</p>

        <div className="tour-actions">
          <span className="tour-dots" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <i key={i} className={i === index ? 'on' : ''} />
            ))}
          </span>
          {index > 0 && (
            <button className="tour-back" onClick={back}>
              Назад
            </button>
          )}
          <button className="btn btn-grad tour-next" onClick={next}>
            {isLast ? 'Готово' : 'Далі'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Підказка після навчання — і коли його пройшли, і коли закрили хрестиком.
 * Показує, куди повертатись, і зникає сама. Нічого не перекриває: це
 * бульбашка під шестернею, а не оверлей.
 */
function TourHint() {
  const { hintVisible, dismissHint } = useTour()
  // Скролити тут доречно: останній крок навчання міг лишити екран
  // прокрученим, а підказці треба, щоб шестерня була на видноті.
  const anchor = useAnchor('settings', hintVisible)

  if (!hintVisible || !anchor) return null

  return (
    <div
      className="tour-hint"
      role="status"
      onClick={dismissHint}
      style={{
        top: anchor.top + anchor.height + 10,
        right: Math.max(10, window.innerWidth - (anchor.left + anchor.width)),
      }}
    >
      Гід по застосунку тут
    </div>
  )
}
