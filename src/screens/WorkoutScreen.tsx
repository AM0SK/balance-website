import { useMemo, useState } from 'react'
import { AnimatedBar } from '@/components/ui/AnimatedBar'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { dateWithWeekday, num } from '@/lib/format'
import { useStore } from '@/lib/store'
import { useSubmit } from '@/lib/useSubmit'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'

export function WorkoutScreen() {
  const { workouts, addWorkout, workoutTypes } = useStore()
  const [adding, setAdding] = useState(false)

  const avgBurned = useMemo(
    () =>
      workouts.length === 0
        ? 0
        : workouts.reduce((sum, w) => sum + w.burnedKcal, 0) / workouts.length,
    [workouts],
  )
  const animatedAvgBurned = useAnimatedNumber(avgBurned)

  const chart = useMemo(() => workouts.slice(0, 12).reverse(), [workouts])
  const maxBurned = Math.max(1, ...chart.map((w) => w.burnedKcal))

  return (
    <>
      {/* Кнопка в один рівень із числом, заголовок — у шапці. */}
      <div className="statrow">
        <div className="statbig">
          <span className="lbl">спалено за тренування, в сер.</span>
          <span className="val num">
            {num(animatedAvgBurned)} <u>ккал</u>
          </span>
        </div>
        <button className="btn-add" onClick={() => setAdding(true)}>
          <Icon name="plus" strokeWidth={2.6} />
          Додати
        </button>
      </div>

      {chart.length > 0 && (
        <section className="chartcard">
          <h3>Тренування за 2 тижні</h3>
          <p>Спалені калорії за сесію</p>
          <div className="bars">
            {chart.map((w) => (
              <AnimatedBar
                key={w.id}
                className={w.burnedKcal >= avgBurned ? 'hi' : ''}
                heightPct={(w.burnedKcal / maxBurned) * 100}
              />
            ))}
          </div>
          <div className="barlabels">
            <span>{chart[0] && dateWithWeekday(chart[0].date).slice(0, 5)}</span>
            <span>{chart.at(-1) && dateWithWeekday(chart.at(-1)!.date).slice(0, 5)}</span>
          </div>
        </section>
      )}

      <div className="histlist">
        {workouts.length === 0 && <p className="empty">Ще немає тренувань</p>}
        {workouts.map((w) => (
          <div className="hrow" key={w.id}>
            <div>
              <div className="hname">{workoutTypes.find((t) => t.id === w.typeId)?.name}</div>
              <div className="hdate">{dateWithWeekday(w.date)}</div>
            </div>
            <div className="hval burn num">−{num(w.burnedKcal)} ккал</div>
          </div>
        ))}
      </div>

      {adding && (
        <AddWorkoutModal
          types={workoutTypes}
          onClose={() => setAdding(false)}
          onSave={(typeId, date, kcal) => addWorkout(typeId, date, kcal)}
        />
      )}
    </>
  )
}

function AddWorkoutModal({
  types,
  onClose,
  onSave,
}: {
  types: { id: string; name: string }[]
  onClose: () => void
  onSave: (typeId: string, date: string, burnedKcal: number) => Promise<void>
}) {
  const [typeId, setTypeId] = useState<string>(types[0]?.id ?? '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [kcal, setKcal] = useState('')
  const { saving, error, submit } = useSubmit()

  const parsed = Number(kcal)
  const valid = Number.isFinite(parsed) && parsed > 0 && typeId !== ''

  return (
    <Modal title="Нове тренування" onClose={onClose}>
      {(close) => (
        <>
          <div className="field">
            <label htmlFor="w-type">Тип</label>
            <select id="w-type" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="w-date">Дата</label>
            <input
              id="w-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="w-kcal">Спалено, ккал</label>
            <input
              id="w-kcal"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="напр. 420"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
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
                  await onSave(typeId, date, parsed)
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
