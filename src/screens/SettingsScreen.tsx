import { useMemo, useState } from 'react'
import { DateField } from '@/components/ui/DateField'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { computeBudgets, guaranteedProtein, PROTEIN_FLOOR } from '@/lib/ration'
import { dec, num } from '@/lib/format'
import { useStore } from '@/lib/store'
import { useSubmit } from '@/lib/useSubmit'
import { useTheme, type ThemePreference } from '@/lib/theme'

type Editing = { kind: 'kcal' } | { kind: 'measure'; key: string } | { kind: 'reset' } | null

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'auto', label: 'Авто' },
  { value: 'light', label: 'Світла' },
  { value: 'dark', label: 'Темна' },
]

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const { profile, measurements, measurementKinds } = useStore()
  const { preference, setPreference } = useTheme()
  const [editing, setEditing] = useState<Editing>(null)

  const latest = (key: string) =>
    measurements
      .filter((m) => m.key === key)
      .sort((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <>
      <div className="stack">
        <header className="topbar">
          <h1 className="pagetitle">Налаштування</h1>
          <div className="right">
            <button
              className="gearbtn gearbtn-close"
              onClick={onClose}
              aria-label="Закрити налаштування"
            >
              <Icon name="close" />
            </button>
          </div>
        </header>

        <div>
          <div className="avatar-wrap">
            {profile.photoUrl ? (
              <img className="avatar-lg" src={profile.photoUrl} alt="" />
            ) : (
              <div className="avatar-lg" />
            )}
          </div>
          <div className="profile-name">{profile.name}</div>
        </div>

        <div>
          <div className="sectionlbl">Ціль</div>
          <div className="plainrows">
            <button className="prow2" onClick={() => setEditing({ kind: 'kcal' })}>
              <span className="name">
                <span className="edit-icon">
                  <Icon name="edit" />
                </span>
                Денний ліміт калорій
              </span>
              <span className="sub num">{num(profile.dailyKcal)} ккал</span>
            </button>
          </div>
        </div>

        <div>
          <div className="sectionlbl">Заміри тіла</div>
          <div className="measures-card">
            {measurementKinds.map((m) => {
              const value = latest(m.key)
              return (
                <button
                  className="measure-row"
                  key={m.key}
                  onClick={() => setEditing({ kind: 'measure', key: m.key })}
                >
                  <span className="name">
                    <span className="edit-icon">
                      <Icon name="edit" />
                    </span>
                    {m.name}
                  </span>
                  <span className="val">
                    {value ? (
                      <>
                        <b className="num">{dec(value.value)}</b>
                        <span>{m.unit}</span>
                      </>
                    ) : (
                      <span>додати</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="sectionlbl">Акаунт</div>
          <div className="plainrows">
            <div className="prow2">
              <span className="name">Тема</span>
              <span className="segmented">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={preference === option.value ? 'on' : ''}
                    onClick={() => setPreference(option.value)}
                    aria-pressed={preference === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </span>
            </div>
            <div className="prow2">
              <span className="name">Мова</span>
              <span className="sub">українська</span>
            </div>
            <button className="prow2" onClick={() => setEditing({ kind: 'reset' })}>
              <span className="name">Скинути прогрес профілю</span>
              <span className="sub danger">скинути</span>
            </button>
          </div>
        </div>
      </div>

      {editing?.kind === 'kcal' && <KcalModal onClose={() => setEditing(null)} />}
      {editing?.kind === 'measure' && (
        <MeasureModal measureKey={editing.key} onClose={() => setEditing(null)} />
      )}
      {editing?.kind === 'reset' && <ResetModal onClose={() => setEditing(null)} />}
    </>
  )
}

function KcalModal({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile, products, categories } = useStore()
  const [value, setValue] = useState(String(profile.dailyKcal))
  const { saving, error, submit } = useSubmit()

  const parsed = Number(value)
  const valid = Number.isFinite(parsed) && parsed >= 800 && parsed <= 5000

  // Показуємо, що станеться з гарантованим білком за цього ліміту.
  const protein = useMemo(() => {
    if (!valid) return null
    return guaranteedProtein(computeBudgets(parsed, products, categories), products, categories)
  }, [parsed, valid, products, categories])

  return (
    <Modal title="Денний ліміт калорій" onClose={onClose}>
      {(close) => (
        <>
          <div className="field">
            <label htmlFor="k-value">Ккал на день</label>
            <input
              id="k-value"
              type="number"
              inputMode="numeric"
              min={800}
              max={5000}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          {protein !== null && (
            <div className="modal-pill">
              Гарантований мінімум білка: {dec(protein)} г
              {protein < PROTEIN_FLOOR && ' — нижче цільових 50 г'}
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="btn-row">
            <button className="btn btn-outline" onClick={close} disabled={saving}>
              Скасувати
            </button>
            <button
              className="btn btn-grad"
              disabled={!valid || saving}
              onClick={() =>
                void submit(async () => {
                  await updateProfile({ dailyKcal: parsed })
                  close()
                })
              }
            >
              {saving ? 'Збереження…' : 'Зберегти'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

function ResetModal({ onClose }: { onClose: () => void }) {
  const { resetProgress } = useStore()
  const { saving, error, submit } = useSubmit()

  return (
    <Modal title={'Дійсно бажаєте скинути\nпрогрес профілю?'} onClose={onClose}>
      {(close) => (
        <>
          <p className="modal-hint spaced">
            Накопичений прогрес за весь час буде безповоротно втрачено: вага, заміри тіла,
            тренування, кроки та раціон.
          </p>

          {error && <p className="form-error">{error}</p>}

          <div className="btn-row">
            <button className="btn btn-outline" onClick={close} disabled={saving}>
              Скасувати
            </button>
            <button
              className="btn btn-danger"
              disabled={saving}
              onClick={() =>
                void submit(async () => {
                  await resetProgress()
                  close()
                })
              }
            >
              {saving ? 'Скидання…' : 'Підтвердити'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

function MeasureModal({ measureKey, onClose }: { measureKey: string; onClose: () => void }) {
  const { addMeasurement, measurementKinds } = useStore()
  const meta = measurementKinds.find((m) => m.key === measureKey)
  const [value, setValue] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const { saving, error, submit } = useSubmit()

  const parsed = Number(value.replace(',', '.'))
  const valid = Number.isFinite(parsed) && parsed > 0

  return (
    <Modal title={meta?.name ?? 'Замір'} onClose={onClose}>
      {(close) => (
        <>
          <div className="field">
            <label htmlFor="m-date">Дата</label>
            <DateField id="m-date" value={date} onChange={setDate} />
          </div>
          <div className="field">
            <label htmlFor="m-value">Значення, {meta?.unit}</label>
            <input
              id="m-value"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="btn-row">
            <button className="btn btn-outline" onClick={close} disabled={saving}>
              Скасувати
            </button>
            <button
              className="btn btn-grad"
              disabled={!valid || saving}
              onClick={() =>
                void submit(async () => {
                  await addMeasurement(measureKey, date, parsed)
                  close()
                })
              }
            >
              {saving ? 'Збереження…' : 'Зберегти'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
