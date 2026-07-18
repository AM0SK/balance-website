import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { dec, num } from '@/lib/format'
import { useSubmit } from '@/lib/useSubmit'
import type { ProductRow } from '@/lib/types'

const QUICK = [25, 50, 75, 100]

/** Ввід кількості продукту. Максимум — показаний ліміт рядка. */
export function QuantityModal({
  row,
  onClose,
  onConfirm,
}: {
  row: ProductRow
  onClose: () => void
  onConfirm: (units: number) => Promise<void>
}) {
  const { product, limit, consumed } = row
  const [value, setValue] = useState(consumed)
  const { saving, error, submit } = useSubmit()
  const isPieces = product.unit === 'pcs'
  const unitLabel = isPieces ? 'шт' : 'г'
  const step = isPieces ? 1 : 5

  const share = limit > 0 ? Math.round((value / limit) * 100) : 0

  return (
    <Modal title={product.name} onClose={onClose}>
      <p className="modal-hint">
        Доступно сьогодні: {num(limit)} {unitLabel}
      </p>
      <div className="modal-pill">Спожито в категорії: {share}% / 100%</div>

      <p className="modal-qty">
        Кількість ({isPieces ? 'шт' : 'грам'}): <b className="num">{dec(value, isPieces ? 0 : 0)}</b>{' '}
        (макс: {num(limit)} {unitLabel})
      </p>

      <input
        className="slider"
        type="range"
        min={0}
        max={Math.max(limit, 1)}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ ['--pct' as string]: `${share}%` }}
        aria-label={`Кількість, ${unitLabel}`}
      />

      <div className="modal-values">
        <div>
          <b className="num">{num(value * product.kcalPerUnit)}</b>
          <span>ккал</span>
        </div>
        <div>
          <b className="num">{dec(value * product.proteinPerUnit)}</b>
          <span>білки, г</span>
        </div>
      </div>

      <div className="quickpct">
        {QUICK.map((p) => {
          const target = isPieces
            ? Math.floor((limit * p) / 100)
            : Math.round((limit * p) / 100)
          return (
            <button
              key={p}
              className={value === target && target > 0 ? 'on' : ''}
              onClick={() => setValue(target)}
            >
              {p}%
            </button>
          )
        })}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="btn-row">
        <button className="btn btn-outline" onClick={onClose} disabled={saving}>
          Скасувати
        </button>
        <button
          className="btn btn-grad"
          disabled={saving}
          onClick={() => void submit(() => onConfirm(value))}
        >
          {saving ? 'Збереження…' : 'Підтвердити'}
        </button>
      </div>
    </Modal>
  )
}
