import { useEffect, useRef, useState } from 'react'

/** Спільна тривалість для всіх анімацій показників — графіки й числа мають рухатись синхронно. */
export const ANIMATION_MS = 1000

const reduceMotion = (): boolean =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3

/**
 * Плавно веде число від поточного видимого значення до нового — рахунок
 * калорій, кроків, кілець прогресу тощо. Перший рендер не анімує, інакше
 * все стартувало б з нуля при відкритті екрана.
 *
 * Стартова точка кожної анімації — те, що зараз реально на екрані
 * (currentRef), а не попередня ціль: якщо значення міняється ще раз
 * до завершення попередньої анімації, число продовжує рух з поточної
 * позиції, а не стрибає.
 */
export function useAnimatedNumber(target: number, durationMs = ANIMATION_MS): number {
  const [display, setDisplay] = useState(target)
  const currentRef = useRef(target)
  const rafRef = useRef<number | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      currentRef.current = target
      setDisplay(target)
      return
    }

    if (reduceMotion() || currentRef.current === target) {
      currentRef.current = target
      setDisplay(target)
      return
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    const from = currentRef.current
    const delta = target - from
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const value = from + delta * easeOutCubic(t)
      currentRef.current = value
      setDisplay(value)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        currentRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, durationMs])

  return display
}
