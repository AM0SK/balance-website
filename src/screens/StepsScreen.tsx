import { useMemo, useState } from 'react'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { dateShort, num, weekday } from '@/lib/format'
import { useStore } from '@/lib/store'
import { useSubmit } from '@/lib/useSubmit'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'

export function StepsScreen() {
  const { profile, steps, addSteps } = useStore()
  const [adding, setAdding] = useState(false)

  const weeklyAvg = useMemo(() => {
    const week = steps.slice(0, 7)
    return week.length === 0 ? 0 : week.reduce((s, e) => s + e.steps, 0) / week.length
  }, [steps])
  const animatedWeeklyAvg = useAnimatedNumber(weeklyAvg)

  const chart = useMemo(() => steps.slice(0, 12).reverse(), [steps])
  const maxSteps = Math.max(profile.stepsGoal, ...chart.map((s) => s.steps))

  return (
    <>
      {/* Кнопка в один рівень із числом, заголовок — у шапці. */}
      <div className="statrow">
        <div className="statbig">
          <span className="lbl">середньотижневий показник</span>
          <span className="val num">{num(animatedWeeklyAvg)}</span>
        </div>
        <button className="btn-add" onClick={() => setAdding(true)}>
          <Icon name="plus" strokeWidth={2.6} />
          Додати
        </button>
      </div>

      {chart.length > 0 && (
        <section className="chartcard">
          <h3>Щоденні кроки</h3>
          <p>За останні {chart.length} днів</p>
          <div className="bars">
            <div
              className="goal"
              data-g={num(profile.stepsGoal)}
              style={{ bottom: `${(profile.stepsGoal / maxSteps) * 100}%` }}
            />
            {chart.map((s) => (
              <AnimatedBar
                key={s.id}
                className={s.steps >= profile.stepsGoal ? 'hi' : ''}
                heightPct={(s.steps / maxSteps) * 100}
              />
            ))}
          </div>
          <div className="barlabels">
            <span>{chart[0] && dateShort(chart[0].date)}</span>
            <span>{chart.at(-1) && dateShort(chart.at(-1)!.date)}</span>
          </div>
        </section>
      )}

      <div className="histlist">
        {steps.length === 0 && <p className="empty">Ще немає записів</p>}
        {steps.map((s) => (
          <div className="hrow" key={s.id}>
            <div>
              <div className="hname">{weekday(s.date)}</div>
              <div className="hdate">{dateShort(s.date)}</div>
            </div>
            <div className="hval num">{num(s.steps)}</div>
          </div>
        ))}
      </div>

      {adding && (
        <AddStepsModal
          onClose={() => setAdding(false)}
          onSave={(date, value) => addSteps(date, value)}
        />
      )}
    </>
  )
}

function AddStepsModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (date: string, steps: number) => Promise<void>
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [value, setValue] = useState('')
  const { saving, error, submit } = useSubmit()

  const parsed = Number(value)
  const valid = Number.isFinite(parsed) && parsed > 0

  return (
    <Modal title="Кроки за день" onClose={onClose}>
      {(close) => (
        <>
          <p className="modal-hint">Запис за цю дату буде перезаписано</p>

          <div className="field">
            <label htmlFor="s-date">Дата</label>
            <input
              id="s-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="s-count">Кроків</label>
            <input
              id="s-count"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="напр. 12 000"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="btn-row">
            <button className="btn btn-outline" onClick={close} disabled={saving}>
              Скасувати
            </button>
            <button
              className="btn btn-grad"
              disabled={!valid || saving}
              onClick={() =>
                void submit(async () => {
                  await onSave(date, parsed)
                  close()
                })
              }
            >
              {saving ? 'Збереження…' : 'Зберегти'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
