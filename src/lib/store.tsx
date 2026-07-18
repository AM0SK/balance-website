import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  MOCK_CONSUMED,
  MOCK_MEASUREMENTS,
  MOCK_PROFILE,
  MOCK_STEPS,
  MOCK_WORKOUTS,
} from '@/data/mockState'
import type { Consumed, Measurement, StepsEntry, UserProfile, Workout } from './types'

/**
 * Стан застосунку на час вёрстки. Тримається в пам'яті; коли з'явиться API,
 * ці ж сигнатури стануть викликами до бекенду, а компоненти не зміняться.
 */
interface Store {
  profile: UserProfile
  consumed: Consumed
  workouts: Workout[]
  steps: StepsEntry[]
  measurements: Measurement[]

  setConsumed: (productId: string, units: number) => void
  updateProfile: (patch: Partial<UserProfile>) => void
  addWorkout: (typeId: string, date: string, burnedKcal: number) => void
  addSteps: (date: string, steps: number) => void
  addMeasurement: (key: string, date: string, value: number) => void
}

const StoreContext = createContext<Store | null>(null)

const uid = (): string => Math.random().toString(36).slice(2, 10)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(MOCK_PROFILE)
  const [consumed, setConsumedState] = useState<Consumed>(MOCK_CONSUMED)
  const [workouts, setWorkouts] = useState<Workout[]>(MOCK_WORKOUTS)
  const [steps, setSteps] = useState<StepsEntry[]>(MOCK_STEPS)
  const [measurements, setMeasurements] = useState<Measurement[]>(MOCK_MEASUREMENTS)

  const value = useMemo<Store>(
    () => ({
      profile,
      consumed,
      workouts,
      steps,
      measurements,

      setConsumed: (productId, units) =>
        setConsumedState((prev) => {
          const next = { ...prev }
          if (units <= 0) delete next[productId]
          else next[productId] = units
          return next
        }),

      updateProfile: (patch) => setProfile((prev) => ({ ...prev, ...patch })),

      addWorkout: (typeId, date, burnedKcal) =>
        setWorkouts((prev) =>
          [{ id: uid(), typeId, date, burnedKcal }, ...prev].sort((a, b) =>
            b.date.localeCompare(a.date),
          ),
        ),

      // Кроки за день перезаписуються, а не додаються другим записом.
      addSteps: (date, value) =>
        setSteps((prev) => {
          const rest = prev.filter((s) => s.date !== date)
          return [{ id: uid(), date, steps: value }, ...rest].sort((a, b) =>
            b.date.localeCompare(a.date),
          )
        }),

      addMeasurement: (key, date, value) =>
        setMeasurements((prev) => {
          const rest = prev.filter((m) => !(m.key === key && m.date === date))
          return [{ id: uid(), key, date, value }, ...rest].sort((a, b) =>
            b.date.localeCompare(a.date),
          )
        }),
    }),
    [profile, consumed, workouts, steps, measurements],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore має викликатись усередині <StoreProvider>')
  return store
}
