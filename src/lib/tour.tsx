import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { TabKey } from '@/components/layout/TabBar'
import { useStore } from './store'

/**
 * Навчання для нових користувачів: підсвічуємо по черзі реальні елементи
 * інтерфейсу й пояснюємо, навіщо вони. Показ керується звідси, малює
 * <TourLayer>.
 *
 * Сцена кроку — це стан застосунку, потрібний, щоб ціль узагалі існувала
 * в DOM (вкладка або екран Налаштувань). Перемикає сцени App: тільки він
 * володіє цим станом.
 */
export type TourScene = { kind: 'tab'; tab: TabKey } | { kind: 'settings' }

export interface TourStep {
  id: string
  scene: TourScene
  /**
   * Значення data-tour підсвіченого елемента. Масив — підсвітити кілька
   * сусідніх однією рамкою. Без цілі картка стає по центру екрана.
   */
  target?: string | string[]
  title: string
  body: string
}

/** Порядок кроків = порядок першого знайомства: спершу налаштувати, далі вести облік. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    scene: { kind: 'tab', tab: 'home' },
    title: 'Вітаємо в Balance',
    body: 'За хвилину покажемо, з чого почати й де що лежить. Пропустити можна будь-коли.',
  },
  {
    id: 'settings',
    scene: { kind: 'tab', tab: 'home' },
    target: 'settings',
    title: 'Налаштування',
    body: 'Тут ваш профіль, ціль калорій і заміри тіла. Почнімо саме звідси.',
  },
  {
    id: 'kcal',
    scene: { kind: 'settings' },
    target: 'kcal',
    title: 'Денний ліміт калорій',
    body: 'Вкажіть свій ліміт — з нього рахуються ліміти всіх продуктів у Раціоні.',
  },
  {
    id: 'measures',
    scene: { kind: 'settings' },
    target: 'measures',
    title: 'Заміри тіла',
    body: 'Внесіть вагу й обхвати. Це стартова точка, від якої видно прогрес.',
  },
  {
    id: 'ration',
    scene: { kind: 'tab', tab: 'ration' },
    target: ['ration-head', 'ration-row'],
    title: 'Раціон',
    body: 'Продукти зібрані у 8 категорій. Бюджет категорії спільний: з’їли одне — ліміти решти продуктів у ній зменшаться.',
  },
  {
    id: 'activity',
    scene: { kind: 'tab', tab: 'workout' },
    target: ['tab-workout', 'tab-steps'],
    title: 'Вправи і Кроки',
    body: 'Записуйте тренування та вносьте кроки за день — так видно вашу активність за тиждень.',
  },
  {
    id: 'home',
    scene: { kind: 'tab', tab: 'home' },
    target: 'home-card',
    title: 'Головна',
    body: 'Тут зведення дня й динаміка. Щоб графіки прогресу рухались, оновлюйте заміри хоча б раз на тиждень.',
  },
]

const STORAGE_KEY = 'balance:tour-done'
/** Пауза перед автостартом: застосунок встигає намалюватись, тур не вискакує ривком. */
const AUTOSTART_MS = 700
/** Скільки висить підказка «навчання можна пройти ще раз». */
const HINT_MS = 5000

interface TourValue {
  /** null — навчання зараз не йде. */
  step: TourStep | null
  index: number
  total: number
  isLast: boolean
  hintVisible: boolean
  start: () => void
  next: () => void
  back: () => void
  /** Завершити: і хрестиком, і після останнього кроку — далі показуємо підказку. */
  stop: () => void
  dismissHint: () => void
}

const TourContext = createContext<TourValue | null>(null)

const seenBefore = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Приватний режим забороняє localStorage — покажемо навчання ще раз, не страшно.
    return false
  }
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { status } = useStore()
  const [index, setIndex] = useState<number | null>(null)
  const [hintVisible, setHintVisible] = useState(false)
  const hintTimerRef = useRef<number | null>(null)

  const showHint = useCallback(() => {
    if (hintTimerRef.current !== null) clearTimeout(hintTimerRef.current)
    setHintVisible(true)
    hintTimerRef.current = window.setTimeout(() => setHintVisible(false), HINT_MS)
  }, [])

  useEffect(
    () => () => {
      if (hintTimerRef.current !== null) clearTimeout(hintTimerRef.current)
    },
    [],
  )

  const stop = useCallback(() => {
    setIndex(null)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Не зберегли — навчання просто запуститься ще раз наступного разу.
    }
    showHint()
  }, [showHint])

  const start = useCallback(() => {
    if (hintTimerRef.current !== null) clearTimeout(hintTimerRef.current)
    setHintVisible(false)
    setIndex(0)
  }, [])

  /*
   * Автостарт для тих, хто ще не бачив навчання. Прапорець ставиться
   * всередині таймера, а не поруч із ним: у StrictMode ефект монтується
   * двічі, і зовнішній прапорець з'їв би єдиний запуск у розробці.
   */
  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current || seenBefore()) return
    if (status !== 'ready' && status !== 'mock') return
    const timer = window.setTimeout(() => {
      startedRef.current = true
      setIndex(0)
    }, AUTOSTART_MS)
    return () => clearTimeout(timer)
  }, [status])

  const value = useMemo<TourValue>(() => {
    const current = index === null ? null : (TOUR_STEPS[index] ?? null)
    return {
      step: current,
      index: index ?? 0,
      total: TOUR_STEPS.length,
      isLast: index !== null && index === TOUR_STEPS.length - 1,
      hintVisible,
      start,
      stop,
      next: () => {
        if (index === null) return
        if (index + 1 < TOUR_STEPS.length) setIndex(index + 1)
        else stop()
      },
      back: () => setIndex((i) => (i === null || i === 0 ? i : i - 1)),
      dismissHint: () => {
        if (hintTimerRef.current !== null) clearTimeout(hintTimerRef.current)
        setHintVisible(false)
      },
    }
  }, [index, hintVisible, start, stop])

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour(): TourValue {
  const value = useContext(TourContext)
  if (!value) throw new Error('useTour має викликатись усередині <TourProvider>')
  return value
}
