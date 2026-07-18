const WEEKDAYS = [
  'Неділя',
  'Понеділок',
  'Вівторок',
  'Середа',
  'Четвер',
  "П'ятниця",
  'Субота',
]

/** 8412 → «8 412». Нерозривний тонкий пробіл, щоб число не ламалось. */
export function num(value: number): string {
  return Math.round(value).toLocaleString('uk-UA').replace(/ /g, ' ')
}

/** Дробові показники: 74.2 кг, 3.1 г білка. Ціле — без хвоста. */
export function dec(value: number, digits = 1): string {
  const rounded = Number(value.toFixed(digits))
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits).replace('.', ',')
}

/** «09.04.2026» */
export function dateShort(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
}

/** «09.04.2026, Субота» — формат історії з макета. */
export function dateWithWeekday(iso: string): string {
  return `${dateShort(iso)}, ${WEEKDAYS[new Date(iso).getDay()]}`
}

export function weekday(iso: string): string {
  return WEEKDAYS[new Date(iso).getDay()]
}

/** «3 дні тому», «сьогодні» — для примітки на Головній. */
export function relativeDays(iso: string, today = new Date()): string {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((start(today) - start(new Date(iso))) / 86_400_000)
  if (days <= 0) return 'сьогодні'
  if (days === 1) return 'вчора'
  if (days < 5) return `${days} дні тому`
  return `${days} днів тому`
}

export const pct = (part: number, whole: number): number =>
  whole <= 0 ? 0 : Math.min(100, Math.round((part / whole) * 100))
