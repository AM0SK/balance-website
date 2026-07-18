/** Кільце прогресу. Товщина береться з --ring-stroke, маска — closest-side. */
export function Ring({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div className="ring" style={{ ['--pct' as string]: clamped }}>
      <i className="fill" />
      <b className="num">{clamped}%</b>
    </div>
  )
}
