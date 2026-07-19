import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildCategoryViews, computeBudgets } from './ration'
import type { Bootstrap } from './api'

/**
 * Прогін доменної логіки на справжній відповіді бойового API.
 *
 * Причина існування: усі продукти показувались із нулями, хоча дані з сервера
 * приходили правильні. Тест ловить розходження між тим, що віддає бекенд,
 * і тим, що очікує математика.
 */
const LIVE = process.env.LIVE_BOOTSTRAP

/*
 * Читаємо ліниво, а не в тілі describe: інакше файл відкривався б під час
 * збору тестів навіть тоді, коли набір пропускається, і без LIVE_BOOTSTRAP
 * падав би весь прогін — а разом з ним і деплой.
 */
const load = (): Bootstrap => JSON.parse(readFileSync(LIVE!, 'utf8'))

describe.runIf(LIVE)('жива відповідь /bootstrap', () => {
  it('віддає довідники', () => {
    const data = load()
    expect(data.categories.length).toBe(8)
    expect(data.products.length).toBeGreaterThan(40)
  })

  it('бюджети категорій не нульові', () => {
    const data = load()
    const budgets = computeBudgets(data.profile.dailyKcal, data.products, data.categories)
    for (const c of data.categories) {
      expect(budgets[c.key], `бюджет ${c.letter}`).toBeGreaterThan(0)
    }
  })

  it('ліміти продуктів не нульові', () => {
    const data = load()
    const budgets = computeBudgets(data.profile.dailyKcal, data.products, data.categories)
    const views = buildCategoryViews(
      data.products,
      data.categories,
      data.consumed,
      budgets,
      data.profile.dailyKcal,
    )

    const zeros = views
      .flatMap((v) => v.rows)
      .filter((r) => r.limit === 0)
      .map((r) => `${r.product.name} (${r.product.categoryKey})`)

    expect(zeros, `нульові ліміти: ${zeros.join(', ')}`).toEqual([])
  })
})
