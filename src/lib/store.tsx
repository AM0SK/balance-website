import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, api, type Bootstrap } from './api'
import { CATEGORIES, MEASUREMENTS, PRODUCTS, WORKOUT_TYPES } from '@/data/catalog'
import {
  MOCK_CONSUMED,
  MOCK_MEASUREMENTS,
  MOCK_PROFILE,
  MOCK_STEPS,
  MOCK_WORKOUTS,
} from '@/data/mockState'
import type { UserProfile } from './types'

/** 'mock' означає, що бекенд недоступний і дані несправжні — це видно в інтерфейсі. */
type Status = 'loading' | 'ready' | 'mock' | 'error'

interface Store extends Bootstrap {
  status: Status
  errorMessage: string | null
  retry: () => void

  setConsumed: (productId: string, units: number) => Promise<void>
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>
  addWorkout: (typeId: string, date: string, burnedKcal: number) => Promise<void>
  addSteps: (date: string, steps: number) => Promise<void>
  addMeasurement: (key: string, date: string, value: number) => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

const today = (): string => new Date().toISOString().slice(0, 10)

/** Дані-заглушки на випадок, коли бекенду ще немає. Форма — та сама, що в API. */
const mockBootstrap = (): Bootstrap => ({
  profile: MOCK_PROFILE,
  categories: CATEGORIES,
  products: PRODUCTS,
  workoutTypes: WORKOUT_TYPES.map((t) => ({ id: t.id, name: t.name })),
  measurementKinds: MEASUREMENTS.map((m) => ({ key: m.key, name: m.name, unit: m.unit })),
  day: today(),
  consumed: MOCK_CONSUMED,
  workouts: MOCK_WORKOUTS,
  steps: MOCK_STEPS,
  measurements: MOCK_MEASUREMENTS,
})

const uid = (): string => Math.random().toString(36).slice(2, 10)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [data, setData] = useState<Bootstrap>(mockBootstrap)

  const load = useCallback(async () => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      setData(await api.bootstrap())
      setStatus('ready')
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Невідома помилка'
      /*
       * У розробці бекенду може ще не бути — працюємо на заглушках, щоб не
       * блокувати вёрстку. На бойовому складання це неприпустимо: показуємо
       * помилку, інакше користувач вирішить, що зберіг дані, а їх нема.
       */
      if (import.meta.env.DEV) {
        setData(mockBootstrap())
        setStatus('mock')
        setErrorMessage(message)
      } else {
        setStatus('error')
        setErrorMessage(message)
      }
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const isMock = status === 'mock'

  const value = useMemo<Store>(
    () => ({
      ...data,
      status,
      errorMessage,
      retry: () => void load(),

      setConsumed: async (productId, units) => {
        if (isMock) {
          setData((prev) => {
            const consumed = { ...prev.consumed }
            if (units <= 0) delete consumed[productId]
            else consumed[productId] = units
            return { ...prev, consumed }
          })
          return
        }
        const { consumed } = await api.setConsumption(productId, units, data.day)
        setData((prev) => ({ ...prev, consumed }))
      },

      updateProfile: async (patch) => {
        if (!isMock) await api.updateProfile(patch)
        setData((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }))
      },

      addWorkout: async (typeId, date, burnedKcal) => {
        if (isMock) {
          setData((prev) => ({
            ...prev,
            workouts: [{ id: uid(), typeId, date, burnedKcal }, ...prev.workouts].sort((a, b) =>
              b.date.localeCompare(a.date),
            ),
          }))
          return
        }
        const { workouts } = await api.addWorkout(typeId, date, burnedKcal)
        setData((prev) => ({ ...prev, workouts }))
      },

      addSteps: async (date, value) => {
        if (isMock) {
          setData((prev) => ({
            ...prev,
            steps: [
              { id: uid(), date, steps: value },
              ...prev.steps.filter((s) => s.date !== date),
            ].sort((a, b) => b.date.localeCompare(a.date)),
          }))
          return
        }
        const { steps } = await api.setSteps(date, value)
        setData((prev) => ({ ...prev, steps }))
      },

      addMeasurement: async (key, date, value) => {
        if (isMock) {
          setData((prev) => ({
            ...prev,
            measurements: [
              { id: uid(), key, date, value },
              ...prev.measurements.filter((m) => !(m.key === key && m.date === date)),
            ].sort((a, b) => b.date.localeCompare(a.date)),
          }))
          return
        }
        const { measurements } = await api.setMeasurement(key, date, value)
        setData((prev) => ({ ...prev, measurements }))
      },
    }),
    [data, status, errorMessage, isMock, load],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore має викликатись усередині <StoreProvider>')
  return store
}
