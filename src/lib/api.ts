import { initData } from './telegram'
import type {
  Category,
  Consumed,
  Measurement,
  Product,
  StepsEntry,
  UserProfile,
  Workout,
} from './types'

/**
 * Клієнт Balance API.
 *
 * Базу можна перевизначити через VITE_API_BASE (наприклад, щоб з локального
 * dev-сервера ходити на бойовий бекенд). За замовчуванням — /api на тому ж домені.
 */
const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export interface Bootstrap {
  profile: UserProfile
  categories: Category[]
  products: Product[]
  workoutTypes: { id: string; name: string }[]
  measurementKinds: { key: string; name: string; unit: string }[]
  day: string
  consumed: Consumed
  workouts: Workout[]
  steps: StepsEntry[]
  measurements: Measurement[]
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        // Підписаний рядок від Telegram. Бекенд звіряє підпис секретом бота.
        'X-Telegram-Init-Data': initData(),
        ...init.headers,
      },
    })
  } catch {
    // fetch кидає лише на мережевій помилці — HTTP-коди сюди не потрапляють.
    throw new ApiError('Немає зв’язку з сервером', 0)
  }

  const text = await response.text()
  let payload: unknown = null
  if (text !== '') {
    try {
      payload = JSON.parse(text)
    } catch {
      throw new ApiError('Сервер повернув не JSON', response.status)
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Помилка сервера (${response.status})`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

const send = <T>(method: string, path: string, body: unknown): Promise<T> =>
  request<T>(path, { method, body: JSON.stringify(body) })

export const api = {
  bootstrap: (day?: string): Promise<Bootstrap> =>
    request<Bootstrap>(`/bootstrap${day ? `?day=${day}` : ''}`),

  updateProfile: (patch: Partial<UserProfile>): Promise<{ ok: true }> =>
    send('PATCH', '/profile', patch),

  setConsumption: (
    productId: string,
    units: number,
    day: string,
  ): Promise<{ consumed: Consumed }> =>
    send('PUT', '/consumption', { productId, units, day }),

  addWorkout: (
    typeId: string,
    day: string,
    burnedKcal: number,
  ): Promise<{ workouts: Workout[] }> => send('POST', '/workouts', { typeId, day, burnedKcal }),

  setSteps: (day: string, steps: number): Promise<{ steps: StepsEntry[] }> =>
    send('PUT', '/steps', { day, steps }),

  setMeasurement: (
    key: string,
    day: string,
    value: number,
  ): Promise<{ measurements: Measurement[] }> =>
    send('PUT', '/measurements', { key, day, value }),

  /**
   * Чистить зібрану статистику й повертає денний ліміт калорій до дефолту.
   * Дані з Telegram і решта цілей профілю лишаються незмінними.
   */
  resetProgress: (): Promise<{
    dailyKcal: number
    consumed: Consumed
    workouts: Workout[]
    steps: StepsEntry[]
    measurements: Measurement[]
  }> => send('POST', '/reset-progress', {}),
}
