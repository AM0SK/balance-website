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
 *
 * replayKey — коли змінюється, анімація програється заново з нуля.
 * Потрібен для кілець прогресу: вкладки не розмонтовуються при
 * перемиканні, тож без цього сигналу кільце назавжди лишалось би
 * «першим рендером» і не анімувалось при поверненні на екран.
 */
export function useAnimatedNumber(
  target: number,
  options: { durationMs?: number; replayKey?: number } = {},
): number {
  const { durationMs = ANIMATION_MS, replayKey } = options
  const [display, setDisplay] = useState(target)
  const currentRef = useRef(target)
  const rafRef = useRef<number | null>(null)
  const mountedRef = useRef(false)
  const replayRef = useRef(replayKey)

  useEffect(() => {
    const isFirst = !mountedRef.current
    mountedRef.current = true

    /*
     * Перезапуск — або зміна replayKey (перехід у вкладку), або найперша
     * поява компонента, якщо replayKey взагалі задано. Друга умова
     * потрібна для кілець на Головній: при відкритті застосунку вони
     * монтуються вже з актуальним лічильником активацій, тож зміни немає
     * і без цього вони показували б кінцеве значення одразу, поки
     * стовпчики графіків поруч виростали з нуля.
     *
     * Числа, що не передають replayKey, як і раніше не анімують першу
     * появу — інакше весь екран стартував би з нулів.
     */
    const isReplay = replayKey !== replayRef.current || (isFirst && replayKey !== undefined)
    replayRef.current = replayKey

    if (isFirst && !isReplay) {
      currentRef.current = target
      setDisplay(target)
      return
    }

    if (reduceMotion()) {
      currentRef.current = target
      setDisplay(target)
      return
    }

    // Без перезапуску нема сенсу анімувати, якщо значення не змінилось.
    if (!isReplay && currentRef.current === target) {
      currentRef.current = target
      setDisplay(target)
      return
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    // Повернення на екран — ведемо з нуля, як і стовпчики графіків.
    const from = isReplay ? 0 : currentRef.current
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
  }, [target, durationMs, replayKey])

  return display
}
