import { useMemo } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Ring } from '@/components/ui/Ring'
import { buildCategoryViews, computeBudgets, dayTotals } from '@/lib/ration'
import { dec, num, pct, relativeDays } from '@/lib/format'
import { useStore } from '@/lib/store'

const startOfWeek = (): string => {
  const d = new Date()
  const diff = (d.getDay() + 6) % 7 // понеділок — початок тижня
  d.setDate(d.getDate() - diff)
  return d.toISOString().slice(0, 10)
}

export function HomeScreen({ onOpenTab }: { onOpenTab: (tab: 'ration' | 'workout' | 'steps') => void }) {
  const {
    profile,
    consumed,
    workouts,
    steps,
    measurements,
    products,
    categories,
    workoutTypes,
    measurementKinds,
  } = useStore()

  const totals = useMemo(() => dayTotals(products, consumed), [products, consumed])
  const filledCategories = useMemo(() => {
    const budgets = computeBudgets(profile.dailyKcal, products, categories)
    return buildCategoryViews(products, categories, consumed, budgets, profile.dailyKcal).filter(
      (v) => v.startedCount > 0,
    ).length
  }, [products, categories, consumed, profile.dailyKcal])

  const today = new Date().toISOString().slice(0, 10)
  const todaySteps = steps.find((s) => s.date === today)?.steps ?? 0

  const weekStart = startOfWeek()
  const weekWorkouts = workouts.filter((w) => w.date >= weekStart)
  const lastWorkout = workouts[0]
  const lastWorkoutName = workoutTypes.find((t) => t.id === lastWorkout?.typeId)?.name

  const weights = measurements
    .filter((m) => m.key === 'weight')
    .sort((a, b) => a.date.localeCompare(b.date))
  const currentWeight = weights.at(-1)
  const weekAgoWeight = weights.at(-2)
  const weightDelta =
    currentWeight && weekAgoWeight ? currentWeight.value - weekAgoWeight.value : null

  const latestByKey = (key: string) =>
    measurements
      .filter((m) => m.key === key)
      .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <button className="card" onClick={() => onOpenTab('ration')}>
        <span className="meta">
          <span className="icon-row">
            <Icon name="ration" />
            раціон
          </span>
          <span className="headline num">
            {num(totals.kcal)} <small>/ {num(profile.dailyKcal)} ккал</small>
          </span>
          <span className="note">
            {filledCategories} із {categories.length} категорій заповнено
          </span>
        </span>
        <Ring percent={pct(totals.kcal, profile.dailyKcal)} />
      </button>

      <button className="card" onClick={() => onOpenTab('steps')}>
        <span className="meta">
          <span className="icon-row">
            <Icon name="steps" />
            кроки
          </span>
          <span className="headline num">
            {num(todaySteps)} <small>/ {num(profile.stepsGoal)}</small>
          </span>
          <span className="note">
            {todaySteps >= profile.stepsGoal ? (
              <>ціль на сьогодні виконано</>
            ) : (
              <>
                до цілі лишилось <b>{num(profile.stepsGoal - todaySteps)}</b>
              </>
            )}
          </span>
        </span>
        <Ring percent={pct(todaySteps, profile.stepsGoal)} />
      </button>

      <button className="card" onClick={() => onOpenTab('workout')}>
        <span className="meta">
          <span className="icon-row">
            <Icon name="workout" />
            тренування
          </span>
          <span className="headline num">
            {weekWorkouts.length} <small>/ {profile.workoutsPerWeekGoal} цього тижня</small>
          </span>
          <span className="note">
            {lastWorkout ? (
              <>
                останнє:{' '}
                <b>
                  {lastWorkoutName}, {relativeDays(lastWorkout.date)}
                </b>
              </>
            ) : (
              <>ще немає записів</>
            )}
          </span>
        </span>
        <Ring percent={pct(weekWorkouts.length, profile.workoutsPerWeekGoal)} />
      </button>

      {currentWeight && (
        <div className="card">
          <div className="meta">
            <span className="icon-row">
              <Icon name="scale" />
              вага
            </span>
            <span className="headline num">
              {dec(currentWeight.value)} <small>кг</small>
            </span>
            {weightDelta !== null && (
              <span className="trend">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                  <path d={weightDelta <= 0 ? 'M6 9l6 6 6-6' : 'M6 15l6-6 6 6'} />
                </svg>
                {weightDelta <= 0 ? '−' : '+'}
                {dec(Math.abs(weightDelta))} кг за тиждень
              </span>
            )}
          </div>
          <div className="sparkline">
            {weights.slice(-7).map((w, i, arr) => {
              const values = arr.map((x) => x.value)
              const min = Math.min(...values)
              const max = Math.max(...values)
              const height = max === min ? 50 : 25 + ((w.value - min) / (max - min)) * 55
              return (
                <i
                  key={w.id}
                  className={i === arr.length - 1 ? 'now' : ''}
                  style={{ height: `${height}%` }}
                />
              )
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ alignItems: 'stretch' }}>
        <div className="meta" style={{ width: '100%' }}>
          <span className="icon-row">
            <Icon name="ruler" />
            заміри тіла
          </span>
          {['waist', 'hips'].map((key) => {
            const history = latestByKey(key)
            const current = history[0]
            const prev = history[1]
            if (!current) return null
            const meta = measurementKinds.find((m) => m.key === key)
            const delta = prev ? current.value - prev.value : 0
            return (
              <div className="measure-row" key={key} style={{ padding: '8px 0' }}>
                <span className="name">{meta?.name.replace('Обхват ', '')}</span>
                <span className="val">
                  <b className="num">{dec(current.value)}</b>
                  <span>{meta?.unit}</span>
                  <span className={`delta num${delta < 0 ? ' down' : ''}`}>
                    {delta > 0 ? '+' : delta < 0 ? '−' : ''}
                    {delta === 0 ? '0' : dec(Math.abs(delta))}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
