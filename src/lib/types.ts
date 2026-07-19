/** Літера категорії обміну. Порядок — як у застосунку. */
export type CategoryKey = 'A' | 'B' | 'V' | 'G' | 'D' | 'E' | 'YE' | 'ZH'

/** Одиниця виміру продукту. Яйця рахуються штуками, решта — грамами. */
export type Unit = 'g' | 'pcs'

export interface Category {
  key: CategoryKey
  /** Літера для чипа: А, Б, В, Г, Д, Е, Є, Ж. */
  letter: string
  name: string
  /**
   * Денний бюджет категорії в ккал при базовому ліміті BASE_KCAL.
   * Продукти всередині ділять цей бюджет між собою — з'їв одне,
   * ліміти решти зменшились. Не плутати з лімітом окремого продукту.
   */
  baseKcal: number
  /** CSS-змінна кольору чипа. */
  colorVar: string
}

export interface Product {
  id: string
  categoryKey: CategoryKey
  name: string
  unit: Unit
  /**
   * Скільки ккал в одиниці (в 1 г або в 1 шт).
   * Це фізична властивість продукту — вона не залежить від ліміту.
   */
  kcalPerUnit: number
  /** Скільки грамів білка в одиниці. */
  proteinPerUnit: number
  /**
   * Власна стеля продукту в одиницях при BASE_KCAL, якщо вона нижча
   * за бюджет категорії. Так поводяться алкоголь і гірчиця: бюджет Ж дозволив би
   * ~190 г міцного, але застосунок обмежує 50 г. Масштабується разом із лімітом.
   *
   * null приходить з API для продуктів без стелі, undefined — коли поле
   * просто не задане в локальному довіднику. Обидва означають «стелі немає».
   */
  maxUnits?: number | null
}

/** Скільки спожито конкретного продукту сьогодні. */
export type Consumed = Record<string, number>

/** Стан рядка продукту в списку. */
export type ProductState = 'default' | 'go' | 'full'

export interface ProductRow {
  product: Product
  /** Спожито (в одиницях продукту). */
  consumed: number
  /**
   * Показаний ліміт = спожито + залишок бюджету категорії,
   * переведений в одиниці цього продукту.
   */
  limit: number
  state: ProductState
}

export interface CategoryView {
  category: Category
  rows: ProductRow[]
  /** Бюджет категорії на сьогодні, ккал. */
  budgetKcal: number
  /** Скільки з нього вже витрачено. */
  spentKcal: number
  /** Скільки продуктів у категорії почато. */
  startedCount: number
}

export interface Workout {
  id: string
  /** Тип із довідника WORKOUT_TYPES. */
  typeId: string
  date: string
  burnedKcal: number
}

export interface StepsEntry {
  id: string
  date: string
  steps: number
}

export interface Measurement {
  id: string
  /** Ключ із довідника MEASUREMENTS. */
  key: string
  date: string
  value: number
}

export interface UserProfile {
  telegramId: number | null
  name: string
  photoUrl: string | null
  /** Денний ліміт калорій — задається в Налаштуваннях. */
  dailyKcal: number
  stepsGoal: number
  workoutsPerWeekGoal: number
}

/**
 * Значення dailyKcal для нового профілю (`users.daily_kcal` у схемі БД).
 * Поки ліміт дорівнює цьому числу, вважаємо, що користувач ще не задав
 * власний — Головна показує підказку налаштувати його.
 */
export const DEFAULT_DAILY_KCAL = 1766
