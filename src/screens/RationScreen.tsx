import { useMemo, useState } from 'react'
import { buildCategoryViews, computeBudgets, dayTotals } from '@/lib/ration'
import { dec, num, pct } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Product } from '@/lib/types'
import { QuantityModal } from './QuantityModal'

export function RationScreen() {
  const { profile, consumed, setConsumed, products, categories } = useStore()
  const [editing, setEditing] = useState<Product | null>(null)

  const budgets = useMemo(
    () => computeBudgets(profile.dailyKcal, products, categories),
    [profile.dailyKcal, products, categories],
  )
  const views = useMemo(
    () => buildCategoryViews(products, categories, consumed, budgets, profile.dailyKcal),
    [products, categories, consumed, budgets, profile.dailyKcal],
  )
  const totals = useMemo(() => dayTotals(products, consumed), [products, consumed])

  const editingRow = editing
    ? views.flatMap((v) => v.rows).find((r) => r.product.id === editing.id)
    : null

  return (
    <>
      {/* Білок — лічильник без цілі, як у реальному застосунку. */}
      <div className="statbig">
        <span className="lbl">Білки</span>
        <span className="val num">
          {dec(totals.protein)} <u>грам</u>
        </span>
      </div>

      <div className="macroblock">
        <div className="macrorow">
          <span className="k">Калорії</span>
          <span className="v num">
            {num(totals.kcal)} / {num(profile.dailyKcal)} ккал
          </span>
        </div>
        <div className="progress-line">
          <i style={{ width: `${pct(totals.kcal, profile.dailyKcal)}%` }} />
        </div>
      </div>

      <div className="legend">
        <span>
          <i style={{ background: 'linear-gradient(90deg,rgba(62,158,110,.6),rgba(62,158,110,.15))' }} />
          почато
        </span>
        <span>
          <i style={{ background: 'linear-gradient(90deg,rgba(204,154,58,.7),rgba(204,154,58,.2))' }} />
          ліміт вичерпано
        </span>
      </div>

      {views.map((view) => (
        <section className="catcard" key={view.category.key}>
          <div className="cathead">
            <div className="chip" style={{ background: `var(${view.category.colorVar})` }}>
              {view.category.letter}
            </div>
            <h2 className="cname">{view.category.name}</h2>
            <span className="csum num">
              {view.startedCount} / {view.rows.length}
            </span>
          </div>

          {view.rows.map((row) => (
            <button
              className={`prow${row.state === 'default' ? '' : ` ${row.state}`}`}
              key={row.product.id}
              onClick={() => setEditing(row.product)}
            >
              <span className="pmeta">
                <span className="pname">{row.product.name}</span>
                <span className="psub num">
                  {num(row.limit * row.product.kcalPerUnit)} ккал ·{' '}
                  {dec(row.limit * row.product.proteinPerUnit)} г білка
                </span>
              </span>
              <span className="pval num">
                {dec(row.consumed, 0)} / {num(row.limit)} {row.product.unit === 'pcs' ? 'шт' : 'г'}
              </span>
            </button>
          ))}
        </section>
      ))}

      {editing && editingRow && (
        <QuantityModal
          row={editingRow}
          onClose={() => setEditing(null)}
          onConfirm={async (units) => {
            await setConsumed(editing.id, units)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}
