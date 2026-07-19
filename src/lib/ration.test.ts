import { describe, expect, it } from 'vitest'
import { CATEGORIES, PRODUCTS } from '@/data/catalog'
import {
  BASE_KCAL,
  PROTEIN_FLOOR,
  buildCategoryViews,
  computeBudgets,
  dayTotals,
  guaranteedProtein,
} from './ration'

const budgetsAt = (kcal: number) => computeBudgets(kcal, PRODUCTS, CATEGORIES)
const viewsAt = (kcal: number, consumed = {}) =>
  buildCategoryViews(PRODUCTS, CATEGORIES, consumed, budgetsAt(kcal), kcal)

const rowFor = (kcal: number, id: string, consumed = {}) => {
  const row = viewsAt(kcal, consumed)
    .flatMap((v) => v.rows)
    .find((r) => r.product.id === id)
  if (!row) throw new Error(`немає продукту ${id}`)
  return row
}

describe('бюджети категорій', () => {
  it('при базовому ліміті дають суму, близьку до нього', () => {
    const total = Object.values(budgetsAt(BASE_KCAL)).reduce((a, b) => a + b, 0)
    // 1733 проти 1766 — розбіжність від округлення грамівок у першоджерелі.
    expect(total).toBeGreaterThan(BASE_KCAL * 0.97)
    expect(total).toBeLessThanOrEqual(BASE_KCAL)
  })

  it('масштабуються пропорційно, поки поріг білка тримається', () => {
    const base = budgetsAt(BASE_KCAL)
    const scaled = budgetsAt(BASE_KCAL / 2 + 500) // 1383 — ще близько до межі
    expect(scaled.A / base.A).toBeLessThan(1)
  })
})

describe('гарантований поріг білка', () => {
  it('на базовому ліміті виконується без перерозподілу', () => {
    const protein = guaranteedProtein(budgetsAt(BASE_KCAL), PRODUCTS, CATEGORIES)
    expect(protein).toBeGreaterThanOrEqual(PROTEIN_FLOOR)
  })

  it.each([1766, 1600, 1400, 1200, 1000])('тримається на %i ккал', (kcal) => {
    const protein = guaranteedProtein(budgetsAt(kcal), PRODUCTS, CATEGORIES)
    expect(protein).toBeGreaterThanOrEqual(PROTEIN_FLOOR)
  })

  it('на низькому ліміті перерозподіл віддає бюджет білковим категоріям', () => {
    const low = budgetsAt(1000)
    const proportionalShareB = 400 * (1000 / BASE_KCAL)
    expect(low.B).toBeGreaterThan(proportionalShareB)
  })
})

describe('ліміт продукту', () => {
  it('це бюджет категорії, поділений на щільність продукту', () => {
    // Картопля: 0.771 ккал/г, бюджет А = 240 → 240 / 0.771 ≈ 311 г.
    expect(rowFor(BASE_KCAL, 'a-potato').limit).toBeCloseTo(311, -1)
  })

  it('падає, коли з тієї ж категорії з’їли інший продукт', () => {
    // Ключове правило: бюджет у категорії спільний.
    // 52 г овочів (0.2 ккал/г) = 10.4 ккал → грибам лишається 109.6 ккал = 548 г.
    const withoutEating = rowFor(BASE_KCAL, 'v-mushrooms').limit
    const afterEating = rowFor(BASE_KCAL, 'v-mushrooms', { 'v-veg': 52 }).limit
    expect(withoutEating).toBe(600)
    expect(afterEating).toBe(548)
  })

  it('враховує вже з’їдене самого продукту', () => {
    const row = rowFor(BASE_KCAL, 'v-veg', { 'v-veg': 52 })
    expect(row.consumed).toBe(52)
    expect(row.limit).toBe(600) // 52 з’їдено + 548 залишку
  })

  it('поважає власну стелю продукту', () => {
    // Бюджет Ж (425 ккал) дозволив би ~193 г міцного, але стеля — 50 г.
    expect(rowFor(BASE_KCAL, 'zh-spirits').limit).toBe(50)
  })

  it('вважає maxUnits: null відсутністю стелі, а не нулем', () => {
    /*
     * API віддає maxUnits: null для продуктів без стелі, тоді як локальний
     * довідник просто не має поля. Перевірка на !== undefined пропускала null,
     * і null * scale обнуляв ліміт КОЖНОГО продукту без стелі — на бойовому
     * сервері весь Раціон показував нулі, а тести на catalog.ts проходили.
     */
    const fromApi = PRODUCTS.map((p) => ({ ...p, maxUnits: p.maxUnits ?? null }))
    const budgets = computeBudgets(BASE_KCAL, fromApi, CATEGORIES)
    const rows = buildCategoryViews(fromApi, CATEGORIES, {}, budgets, BASE_KCAL).flatMap(
      (v) => v.rows,
    )

    expect(rows.filter((r) => r.limit === 0)).toEqual([])
    expect(rows.find((r) => r.product.id === 'a-potato')?.limit).toBeCloseTo(311, -1)
  })

  it('штучні одиниці округлює вниз', () => {
    const eggs = rowFor(BASE_KCAL, 'b-eggs')
    expect(Number.isInteger(eggs.limit)).toBe(true)
    expect(eggs.limit).toBe(5) // 400 / 78.5 = 5.09
  })
})

describe('стани рядка', () => {
  it('default, поки продукт не почато', () => {
    expect(rowFor(BASE_KCAL, 'v-veg').state).toBe('default')
  })

  it('go, коли почато і бюджет не вичерпано', () => {
    expect(rowFor(BASE_KCAL, 'v-veg', { 'v-veg': 52 }).state).toBe('go')
  })

  it('full, коли бюджет категорії вичерпано', () => {
    // 600 г овочів = 120 ккал = весь бюджет В.
    expect(rowFor(BASE_KCAL, 'v-mushrooms', { 'v-veg': 600 }).state).toBe('full')
  })
})

describe('підсумки дня', () => {
  it('рахують ккал і білок за спожитим', () => {
    const { kcal, protein } = dayTotals(PRODUCTS, { 'b-eggs': 2, 'v-veg': 100 })
    expect(kcal).toBeCloseTo(2 * 78.5 + 100 * 0.2, 1)
    expect(protein).toBeCloseTo(2 * 6.25 + 100 * 0.015, 1)
  })
})
