import type {
  Category,
  CategoryKey,
  CategoryView,
  Consumed,
  Product,
  ProductRow,
  ProductState,
} from './types'

/**
 * Базовий денний ліміт, під який пораховані baseKcal усіх категорій.
 * Якщо користувач ставить інший ліміт — бюджети масштабуються від цього числа.
 */
export const BASE_KCAL = 1766

/**
 * Гарантований нижній поріг білка за день.
 * Сенс: за будь-якого вибору продуктів, вичерпавши денний ліміт калорій,
 * користувач набере не менше цієї кількості білка. Скільки буде понад — не важливо.
 */
export const PROTEIN_FLOOR = 50

/** Межі, за які перерозподіл не має права виводити категорію. */
const MIN_SHARE = 0.4
const MAX_SHARE = 2.0

export type Budgets = Record<CategoryKey, number>

/**
 * Найгірше співвідношення білок/ккал у категорії:
 * продукт, яким можна «з'їсти» весь бюджет і отримати найменше білка.
 * Саме воно визначає гарантований мінімум.
 */
export function worstProteinRatio(products: Product[], key: CategoryKey): number {
  const inCategory = products.filter((p) => p.categoryKey === key)
  if (inCategory.length === 0) return 0
  return Math.min(...inCategory.map((p) => p.proteinPerUnit / p.kcalPerUnit))
}

/** Гарантований мінімум білка за поточних бюджетів. */
export function guaranteedProtein(
  budgets: Budgets,
  products: Product[],
  categories: Category[],
): number {
  return categories.reduce(
    (sum, c) => sum + budgets[c.key] * worstProteinRatio(products, c.key),
    0,
  )
}

/**
 * Бюджети категорій під заданий денний ліміт калорій.
 *
 * Спершу все масштабується пропорційно. Якщо після цього гарантований мінімум
 * білка падає нижче PROTEIN_FLOOR (а це стається на низьких лімітах, приблизно
 * нижче 1425 ккал), бюджет поступово переливається з категорій із найгіршим
 * співвідношенням білок/ккал у категорії з найкращим — доки поріг не виконається
 * або доки перерозподіляти вже нема звідки.
 */
export function computeBudgets(
  dailyKcal: number,
  products: Product[],
  categories: Category[],
): Budgets {
  const scale = dailyKcal / BASE_KCAL
  const budgets = {} as Budgets
  const proportional = {} as Budgets

  for (const c of categories) {
    const share = c.baseKcal * scale
    budgets[c.key] = share
    proportional[c.key] = share
  }

  const ratios = new Map(categories.map((c) => [c.key, worstProteinRatio(products, c.key)]))
  const byRatioAsc = [...categories].sort(
    (a, b) => (ratios.get(a.key) ?? 0) - (ratios.get(b.key) ?? 0),
  )

  // Крок переливання — 1% денного ліміту. Досить дрібно, щоб не перестрибнути поріг,
  // і досить велико, щоб зійтися за пару десятків ітерацій.
  const step = dailyKcal * 0.01
  const maxIterations = 500

  for (let i = 0; i < maxIterations; i++) {
    if (guaranteedProtein(budgets, products, categories) >= PROTEIN_FLOOR) break

    const donor = byRatioAsc.find((c) => budgets[c.key] - step >= proportional[c.key] * MIN_SHARE)
    const receiver = [...byRatioAsc]
      .reverse()
      .find((c) => budgets[c.key] + step <= proportional[c.key] * MAX_SHARE)

    // Нема звідки взяти або нема куди покласти — поріг недосяжний за цих продуктів.
    if (!donor || !receiver || donor.key === receiver.key) break

    budgets[donor.key] -= step
    budgets[receiver.key] += step
  }

  return budgets
}

/** Ккал, витрачені в категорії на сьогодні. */
function spentInCategory(products: Product[], key: CategoryKey, consumed: Consumed): number {
  return products
    .filter((p) => p.categoryKey === key)
    .reduce((sum, p) => sum + (consumed[p.id] ?? 0) * p.kcalPerUnit, 0)
}

/**
 * Ліміт конкретного продукту = скільки вже з'їдено цього продукту
 * плюс скільки ще влізе в залишок бюджету категорії.
 *
 * Тому ліміт «пливе»: з'їв щось інше з тієї ж категорії — ліміт цього впав.
 */
function limitFor(
  product: Product,
  consumedUnits: number,
  remainingKcal: number,
  scale: number,
): number {
  const extra = remainingKcal / product.kcalPerUnit
  let raw = consumedUnits + Math.max(0, extra)

  /*
   * Власна стеля продукту, якщо вона жорсткіша за бюджет категорії.
   *
   * Перевірка саме на null І undefined: API віддає null для продуктів без
   * стелі, локальний довідник просто не має поля. Раніше стояло !== undefined,
   * і null проходив далі — null * scale дає 0, тож ліміт кожного продукту
   * без стелі обнулявся.
   */
  if (product.maxUnits != null) raw = Math.min(raw, product.maxUnits * scale)

  return product.unit === 'pcs' ? Math.floor(raw) : Math.round(raw)
}

function stateFor(consumedUnits: number, remainingKcal: number): ProductState {
  if (remainingKcal <= 0.5) return 'full'
  return consumedUnits > 0 ? 'go' : 'default'
}

/** Готові до відображення категорії з порахованими лімітами і станами. */
export function buildCategoryViews(
  products: Product[],
  categories: Category[],
  consumed: Consumed,
  budgets: Budgets,
  dailyKcal: number,
): CategoryView[] {
  const scale = dailyKcal / BASE_KCAL
  return categories.map((category) => {
    const spentKcal = spentInCategory(products, category.key, consumed)
    const budgetKcal = budgets[category.key]
    const remainingKcal = Math.max(0, budgetKcal - spentKcal)

    const rows: ProductRow[] = products
      .filter((p) => p.categoryKey === category.key)
      .map((product) => {
        const consumedUnits = consumed[product.id] ?? 0
        return {
          product,
          consumed: consumedUnits,
          limit: limitFor(product, consumedUnits, remainingKcal, scale),
          state: stateFor(consumedUnits, remainingKcal),
        }
      })

    return {
      category,
      rows,
      budgetKcal,
      spentKcal,
      startedCount: rows.filter((r) => r.consumed > 0).length,
    }
  })
}

/** Підсумки дня для шапки Раціону і картки на Головній. */
export function dayTotals(products: Product[], consumed: Consumed) {
  let kcal = 0
  let protein = 0
  for (const p of products) {
    const units = consumed[p.id] ?? 0
    kcal += units * p.kcalPerUnit
    protein += units * p.proteinPerUnit
  }
  return { kcal, protein }
}
