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
      {(close) => (
        <>
          <p className="modal-hint">
            Доступно сьогодні: {num(limit)} {unitLabel}
          </p>
          <div className="modal-pill">Спожито в категорії: {share}% / 100%</div>

          <p className="modal-qty">
            Кількість ({isPieces ? 'шт' : 'грам'}):{' '}
            <b className="num">{dec(value, isPieces ? 0 : 0)}</b> (макс: {num(limit)} {unitLabel})
          </p>

          {/*
            step="any", а крок застосовуємо вручну в onChange.
            Причина: HTML прив'язує range до сітки min + n*step, тож коли
            ліміт не кратний кроку (напр. max=53 при step=5), максимум
            фізично недосяжний — повзунок упирається в 50 і ніколи не
            доходить до кінця, навіть коли натиснути «100%».
          */}
          <input
            className="slider"
            type="range"
            min={0}
            max={Math.max(limit, 1)}
            step="any"
            value={value}
            onChange={(e) => {
              const raw = Number(e.target.value)
              // Округлення до кроку, але ліміт завжди досяжний точно.
              setValue(Math.min(limit, Math.round(raw / step) * step))
            }}
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
              /*
               * <input type="range" step={step}> сам обмежує позицію повзунка
               * кратними step значеннями. Якщо порахувати «рівно 25% від
               * ліміту» без округлення до кроку — повзунок і наша заливка
               * (--pct, рахується від того самого value) розійдуться:
               * браузер намалює повзунок у найближчій дозволеній точці,
               * а текст/заливка покажуть нашу нерівну цифру. 100% — виняток,
               * max завжди коректна позиція для range independent від step.
               */
              const raw = (limit * p) / 100
              const target = p === 100 ? limit : Math.min(limit, Math.round(raw / step) * step)
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
            <button className="btn btn-outline" onClick={close} disabled={saving}>
              Скасувати
            </button>
            <button
              className="btn btn-grad"
              disabled={saving}
              onClick={() =>
                void submit(async () => {
                  await onConfirm(value)
                  close()
                })
              }
            >
              {saving ? 'Збереження…' : 'Підтвердити'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
