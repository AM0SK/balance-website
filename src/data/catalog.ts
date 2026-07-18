import type { Category, Product } from '@/lib/types'

/**
 * Категорії обміну. baseKcal — денний бюджет категорії при BASE_KCAL (1766).
 * Числа виведені зі скріншотів реального застосунку: всередині категорії
 * будь-який продукт «коштує» приблизно однаково, і це й є бюджет.
 * Сума ≈ 1733 проти заявлених 1766 — розбіжність від округлень, прийнято як є.
 */
export const CATEGORIES: Category[] = [
  { key: 'A', letter: 'А', name: 'Крупи та злаки', baseKcal: 240, colorVar: '--chip-a' },
  { key: 'B', letter: 'Б', name: 'Білкові продукти', baseKcal: 400, colorVar: '--chip-b' },
  { key: 'V', letter: 'В', name: 'Овочі та гриби', baseKcal: 120, colorVar: '--chip-v' },
  { key: 'G', letter: 'Г', name: 'Жири та соуси', baseKcal: 128, colorVar: '--chip-g' },
  { key: 'D', letter: 'Д', name: 'Молочні', baseKcal: 160, colorVar: '--chip-d' },
  { key: 'E', letter: 'Е', name: 'Фрукти та ягоди', baseKcal: 200, colorVar: '--chip-e' },
  { key: 'YE', letter: 'Є', name: 'Горіхи та насіння', baseKcal: 60, colorVar: '--chip-ye' },
  {
    key: 'ZH',
    letter: 'Ж',
    name: 'Солодощі, снеки, алкоголь',
    baseKcal: 425,
    colorVar: '--chip-zh',
  },
]

/**
 * Продукти. kcalPerUnit і proteinPerUnit — на 1 г (або на 1 шт для яєць).
 * Отримані діленням «ккал порції ÷ грами порції» зі скріншотів:
 * саме щільність є властивістю продукту, а грамівка — похідна від бюджету.
 */
export const PRODUCTS: Product[] = [
  // ── А · крупи та злаки ────────────────────────────────────────────────
  { id: 'a-beans', categoryKey: 'A', name: 'Бобові', unit: 'g', kcalPerUnit: 3.107, proteinPerUnit: 0.2 },
  { id: 'a-grain', categoryKey: 'A', name: 'Будь-яка крупа', unit: 'g', kcalPerUnit: 3.307, proteinPerUnit: 0.1 },
  { id: 'a-potato', categoryKey: 'A', name: 'Картопля', unit: 'g', kcalPerUnit: 0.771, proteinPerUnit: 0.02 },
  { id: 'a-corn', categoryKey: 'A', name: 'Кукурудза свіжа', unit: 'g', kcalPerUnit: 0.861, proteinPerUnit: 0.033 },
  { id: 'a-lavash', categoryKey: 'A', name: 'Лаваш', unit: 'g', kcalPerUnit: 2.4, proteinPerUnit: 0.08 },
  { id: 'a-pasta', categoryKey: 'A', name: 'Макарони т.с.', unit: 'g', kcalPerUnit: 3.4, proteinPerUnit: 0.12 },
  { id: 'a-rice', categoryKey: 'A', name: 'Рис (не шліфований)', unit: 'g', kcalPerUnit: 3.307, proteinPerUnit: 0.075 },
  { id: 'a-crispbread', categoryKey: 'A', name: 'Хлібці', unit: 'g', kcalPerUnit: 3.2, proteinPerUnit: 0.1 },
  { id: 'a-flour', categoryKey: 'A', name: 'Цільнозернове борошно', unit: 'g', kcalPerUnit: 3.2, proteinPerUnit: 0.111 },
  { id: 'a-bread', categoryKey: 'A', name: 'Цільнозерновий хліб', unit: 'g', kcalPerUnit: 2.505, proteinPerUnit: 0.089 },

  // ── Б · білкові продукти ──────────────────────────────────────────────
  { id: 'b-poultry', categoryKey: 'B', name: 'Куряче або індиче філе', unit: 'g', kcalPerUnit: 1.101, proteinPerUnit: 0.22 },
  { id: 'b-seafood', categoryKey: 'B', name: 'Морепродукти', unit: 'g', kcalPerUnit: 1.0, proteinPerUnit: 0.2 },
  { id: 'b-liver', categoryKey: 'B', name: 'Печінка', unit: 'g', kcalPerUnit: 1.3, proteinPerUnit: 0.18 },
  { id: 'b-fish-fat', categoryKey: 'B', name: 'Риба (від 5% жиру)', unit: 'g', kcalPerUnit: 1.702, proteinPerUnit: 0.18 },
  { id: 'b-fish-lean', categoryKey: 'B', name: 'Риба (до 5% жиру)', unit: 'g', kcalPerUnit: 1.101, proteinPerUnit: 0.2 },
  { id: 'b-veal', categoryKey: 'B', name: 'Телятина', unit: 'g', kcalPerUnit: 1.702, proteinPerUnit: 0.2 },
  { id: 'b-eggs', categoryKey: 'B', name: 'Яйця (цілі)', unit: 'pcs', kcalPerUnit: 78.5, proteinPerUnit: 6.25 },

  // ── В · овочі та гриби ────────────────────────────────────────────────
  { id: 'v-mushrooms', categoryKey: 'V', name: 'Гриби', unit: 'g', kcalPerUnit: 0.2, proteinPerUnit: 0.035 },
  { id: 'v-veg', categoryKey: 'V', name: 'Овочі (квашені також і зелень)', unit: 'g', kcalPerUnit: 0.2, proteinPerUnit: 0.015 },

  // ── Г · жири та соуси ─────────────────────────────────────────────────
  { id: 'g-avocado', categoryKey: 'G', name: 'Авокадо', unit: 'g', kcalPerUnit: 1.6, proteinPerUnit: 0.02 },
  { id: 'g-oil', categoryKey: 'G', name: 'Будь-яка олія', unit: 'g', kcalPerUnit: 9.0, proteinPerUnit: 0 },
  { id: 'g-mustard', categoryKey: 'G', name: 'Гірчиця', unit: 'g', kcalPerUnit: 0.65, proteinPerUnit: 0.05, maxUnits: 100 },
  { id: 'g-ketchup', categoryKey: 'G', name: 'Кетчуп', unit: 'g', kcalPerUnit: 1.0, proteinPerUnit: 0.01 },
  { id: 'g-mayo', categoryKey: 'G', name: 'Майонез', unit: 'g', kcalPerUnit: 6.0, proteinPerUnit: 0.01 },
  { id: 'g-olives', categoryKey: 'G', name: 'Оливки', unit: 'g', kcalPerUnit: 1.155, proteinPerUnit: 0.01 },

  // ── Д · молочні ───────────────────────────────────────────────────────
  { id: 'd-kefir', categoryKey: 'D', name: 'Кефір 1%', unit: 'g', kcalPerUnit: 0.444, proteinPerUnit: 0.031 },
  { id: 'd-poultry', categoryKey: 'D', name: 'Куряче або індиче філе', unit: 'g', kcalPerUnit: 1.1, proteinPerUnit: 0.22 },
  { id: 'd-milk', categoryKey: 'D', name: 'Молоко 1%', unit: 'g', kcalPerUnit: 0.444, proteinPerUnit: 0.031 },
  { id: 'd-yogurt', categoryKey: 'D', name: 'Несолодкий йогурт 1% жиру', unit: 'g', kcalPerUnit: 0.456, proteinPerUnit: 0.032 },
  { id: 'd-cottage', categoryKey: 'D', name: 'Сир кисломолочний нежирний', unit: 'g', kcalPerUnit: 0.8, proteinPerUnit: 0.18 },
  { id: 'd-cheese', categoryKey: 'D', name: "Сири м'які, тверді, плавлені", unit: 'g', kcalPerUnit: 3.5, proteinPerUnit: 0.2 },
  { id: 'd-sourcream', categoryKey: 'D', name: 'Сметана 15%', unit: 'g', kcalPerUnit: 1.505, proteinPerUnit: 0.08 },

  // ── Е · фрукти та ягоди ───────────────────────────────────────────────
  { id: 'e-banana', categoryKey: 'E', name: 'Банани, виноград, хурма', unit: 'g', kcalPerUnit: 0.952, proteinPerUnit: 0.01 },
  { id: 'e-fruit', categoryKey: 'E', name: 'Фрукти та ягоди', unit: 'g', kcalPerUnit: 0.5, proteinPerUnit: 0.01 },

  // ── Є · горіхи та насіння ─────────────────────────────────────────────
  { id: 'ye-nuts', categoryKey: 'YE', name: 'Будь-які горіхи', unit: 'g', kcalPerUnit: 6.0, proteinPerUnit: 0.2 },
  { id: 'ye-seeds', categoryKey: 'YE', name: 'Насіння', unit: 'g', kcalPerUnit: 6.0, proteinPerUnit: 0.2 },

  // ── Ж · солодощі, снеки, алкоголь ─────────────────────────────────────
  { id: 'zh-banana', categoryKey: 'ZH', name: 'Банани, виноград, хурма', unit: 'g', kcalPerUnit: 0.951, proteinPerUnit: 0.01 },
  { id: 'zh-anything', categoryKey: 'ZH', name: 'Будь-що (солодощі, снеки)', unit: 'g', kcalPerUnit: 5.0, proteinPerUnit: 0.051 },
  { id: 'zh-spirits', categoryKey: 'ZH', name: 'Міцні алкогольні напої', unit: 'g', kcalPerUnit: 2.2, proteinPerUnit: 0, maxUnits: 50 },
  { id: 'zh-beer', categoryKey: 'ZH', name: 'Пиво', unit: 'g', kcalPerUnit: 0.429, proteinPerUnit: 0, maxUnits: 240 },
  { id: 'zh-wine', categoryKey: 'ZH', name: 'Сухе вино', unit: 'g', kcalPerUnit: 0.693, proteinPerUnit: 0, maxUnits: 150 },
  { id: 'zh-fruit', categoryKey: 'ZH', name: 'Фрукти та ягоди', unit: 'g', kcalPerUnit: 0.5, proteinPerUnit: 0.01 },
]

/** Довідник типів тренувань. Ккал користувач вводить сам. */
export const WORKOUT_TYPES = [
  { id: 'gym', name: 'Тренування в залі' },
  { id: 'run', name: 'Пробіжка' },
  { id: 'walk', name: 'Ходьба' },
  { id: 'bike', name: 'Велосипед' },
  { id: 'swim', name: 'Плавання' },
  { id: 'yoga', name: 'Йога' },
  { id: 'other', name: 'Інше' },
] as const

/** Заміри тіла. Порядок — як у Налаштуваннях. */
export const MEASUREMENTS = [
  { key: 'weight', name: 'Вага', unit: 'кг' },
  { key: 'arm', name: 'Обхват плеча', unit: 'см' },
  { key: 'chest', name: 'Обхват грудей', unit: 'см' },
  { key: 'waist', name: 'Обхват талії', unit: 'см' },
  { key: 'hips', name: 'Обхват стегон', unit: 'см' },
] as const
