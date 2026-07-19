import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { useScreenActivation } from '@/lib/screenActivation'

/**
 * Кільце прогресу. Товщина береться з --ring-stroke, маска — closest-side.
 *
 * --pct анімується через requestAnimationFrame (useAnimatedNumber), а не
 * через CSS transition на custom property: підтримка анімованих
 * custom properties (@property) нерівномірна між WebView на Android і
 * WebKit у Telegram iOS. Оновлення числа щокадру рухає дугу й підпис
 * синхронно в обох.
 *
 * replayKey — щоб кільце заповнювалось заново на кожен вхід у вкладку,
 * так само як виростають стовпчики графіків. Без нього вкладка лишається
 * змонтованою і кільце анімувалось би тільки при зміні самих даних.
 */
export function Ring({ percent }: { percent: number }) {
  const activation = useScreenActivation()
  const clamped = Math.max(0, Math.min(100, percent))
  const animated = useAnimatedNumber(clamped, { replayKey: activation })
  const rounded = Math.round(animated)

  return (
    <div className="ring" style={{ ['--pct' as string]: animated }}>
      <i className="fill" />
      <b className="num">{rounded}%</b>
    </div>
  )
}
