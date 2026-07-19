import { useAnimatedNumber } from '@/lib/useAnimatedNumber'

/**
 * Кільце прогресу. Товщина береться з --ring-stroke, маска — closest-side.
 *
 * --pct анімується через requestAnimationFrame (useAnimatedNumber), а не
 * через CSS transition на custom property: підтримка анімованих
 * custom properties (@property) нерівномірна між WebView на Android і
 * WebKit у Telegram iOS. Оновлення числа щокадру рухає дугу й підпис
 * синхронно в обох.
 */
export function Ring({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const animated = useAnimatedNumber(clamped)
  const rounded = Math.round(animated)

  return (
    <div className="ring" style={{ ['--pct' as string]: animated }}>
      <i className="fill" />
      <b className="num">{rounded}%</b>
    </div>
  )
}
