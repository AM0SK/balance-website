import type { Consumed, Measurement, StepsEntry, UserProfile, Workout } from '@/lib/types'

/**
 * Тимчасові дані, поки немає бекенду. Форма збігається з тим,
 * що згодом віддаватиме API, тож заміна буде точковою.
 */

export const MOCK_PROFILE: UserProfile = {
  telegramId: null,
  name: 'Олена Коваль',
  photoUrl: null,
  dailyKcal: 1766,
  stepsGoal: 12000,
  workoutsPerWeekGoal: 3,
}

export const MOCK_CONSUMED: Consumed = {
  'a-grain': 40,
  'b-veal': 58,
  'b-eggs': 2,
  'v-veg': 52,
  'g-avocado': 40,
}

const daysAgo = (n: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const MOCK_WORKOUTS: Workout[] = [
  { id: 'w1', typeId: 'gym', date: daysAgo(3), burnedKcal: 462 },
  { id: 'w2', typeId: 'run', date: daysAgo(6), burnedKcal: 388 },
  { id: 'w3', typeId: 'gym', date: daysAgo(8), burnedKcal: 410 },
  { id: 'w4', typeId: 'bike', date: daysAgo(11), burnedKcal: 356 },
  { id: 'w5', typeId: 'gym', date: daysAgo(13), burnedKcal: 474 },
]

export const MOCK_STEPS: StepsEntry[] = Array.from({ length: 14 }, (_, i) => ({
  id: `s${i}`,
  date: daysAgo(i),
  // Псевдовипадково, але стабільно між рендерами.
  steps: 8000 + ((i * 2137) % 6500),
}))

export const MOCK_MEASUREMENTS: Measurement[] = [
  { id: 'm1', key: 'weight', date: daysAgo(0), value: 74.2 },
  { id: 'm2', key: 'weight', date: daysAgo(7), value: 74.8 },
  { id: 'm3', key: 'weight', date: daysAgo(14), value: 75.4 },
  { id: 'm4', key: 'weight', date: daysAgo(21), value: 75.9 },
  { id: 'm5', key: 'arm', date: daysAgo(0), value: 31 },
  { id: 'm6', key: 'chest', date: daysAgo(0), value: 88 },
  { id: 'm7', key: 'waist', date: daysAgo(0), value: 76 },
  { id: 'm8', key: 'waist', date: daysAgo(14), value: 77 },
  { id: 'm9', key: 'hips', date: daysAgo(0), value: 98 },
  { id: 'm10', key: 'hips', date: daysAgo(14), value: 98 },
]
