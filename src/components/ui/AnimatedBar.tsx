import { useEffect, useRef, useState } from 'react'
import { useScreenActivation } from '@/lib/screenActivation'

/**
 * Стовпчик графіка (Кроки, Вправи, спарклайн ваги), що виростає з нуля
 * при появі, плавно змінює висоту при оновленні значення і програє
 * анімацію заново при кожному вході у вкладку.
 *
 * Звичайного CSS transition на height недостатньо для нового стовпчика:
 * щойно змонтований елемент одразу малюється в кінцевому стані — браузеру
 * нема від чого анімувати. Тому спершу ставимо 0%, а вже наступний кадр
 * виставляє ціль: тоді transition має «звідки».
 *
 * Скидання на 0 обов'язково йде з transition:none, інакше стовпчик
 * спершу цілу секунду повзе ВНИЗ, і лише потім росте.
 */
export function AnimatedBar({
  heightPct,
  className,
}: {
  heightPct: number
  className?: string
}) {
  const activation = useScreenActivation()
  const [state, setState] = useState({ height: 0, instant: true })
  const firstRenderRef = useRef(true)
  const activationRef = useRef(activation)

  useEffect(() => {
    const isReplay = activation !== activationRef.current
    activationRef.current = activation
    const isFirst = firstRenderRef.current
    firstRenderRef.current = false

    // Поява або повернення у вкладку — ростемо з нуля.
    if (isFirst || isReplay) {
      setState({ height: 0, instant: true })

      /*
       * Два кадри, а не один: перший дає браузеру намалювати height:0
       * з вимкненим переходом, другий вмикає перехід і ставить ціль.
       * В одному кадрі React злив би обидва стани в один рендер
       * і анімації знову не було б від чого стартувати.
       */
      let second = 0
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setState({ height: heightPct, instant: false }))
      })
      return () => {
        cancelAnimationFrame(first)
        cancelAnimationFrame(second)
      }
    }

    // Звичайна зміна значення — плавний перехід від поточної висоти.
    setState({ height: heightPct, instant: false })
  }, [heightPct, activation])

  return (
    <i
      className={className}
      style={{ height: `${state.height}%`, transition: state.instant ? 'none' : undefined }}
    />
  )
}
