import { useEffect, useRef, useState } from 'react'

/**
 * Стовпчик графіка (Кроки, Вправи, спарклайн ваги), що виростає з нуля
 * при появі й плавно змінює висоту при оновленні значення.
 *
 * Звичайного CSS transition на height недостатньо для нового стовпчика:
 * щойно змонтований елемент одразу малюється в кінцевому стані — браузеру
 * нема від чого анімувати. Тому перший рендер ставить 0%, а вже наступний
 * кадр (після монтування) виставляє ціль — тоді transition має «звідки».
 * Для стовпчика, що вже існував і просто змінив значення, це працює як
 * звичайний CSS transition: рахунок іде від висоти, яку браузер щойно
 * намалював, до нової.
 */
export function AnimatedBar({
  heightPct,
  className,
  dataAttrs,
}: {
  heightPct: number
  className?: string
  dataAttrs?: Record<string, string>
}) {
  const [height, setHeight] = useState(0)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      const raf = requestAnimationFrame(() => setHeight(heightPct))
      return () => cancelAnimationFrame(raf)
    }
    setHeight(heightPct)
  }, [heightPct])

  return <i className={className} style={{ height: `${height}%` }} {...dataAttrs} />
}
