import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { computeBudgets, guaranteedProtein, PROTEIN_FLOOR } from '@/lib/ration'
import { dec, num } from '@/lib/format'
import { useStore } from '@/lib/store'
import { useSubmit } from '@/lib/useSubmit'

type Editing =
  | { kind: 'profile' }
  | { kind: 'kcal' }
  | { kind: 'measure'; key: string }
  | null

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const { profile, measurements, measurementKinds } = useStore()
  const [editing, setEditing] = useState<Editing>(null)

  const latest = (key: string) =>
    measurements
      .filter((m) => m.key === key)
      .sort((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <>
      <header className="topbar">
        <div className="wordmark" style={{ opacity: 0.45 }}>
          Balance
        </div>
        <div className="right">
          <button
            className="gearbtn"
            onClick={onClose}
            aria-label="Закрити налаштування"
            style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'transparent' }}
          >
            <Icon name="close" />
          </button>
        </div>
      </header>

      <div className="stack">
        <div className="pagehead">
          <h1 className="pagetitle">Налаштування</h1>
        </div>

        <div>
          <div className="avatar-wrap">
            {profile.photoUrl ? (
              <img className="avatar-lg" src={profile.photoUrl} alt="" />
            ) : (
              <div className="avatar-lg" />
            )}
            <div className="edit" aria-hidden="true">
              ✎
            </div>
          </div>
          <div className="profile-name">{profile.name}</div>
          <button
            className="username"
            onClick={() => setEditing({ kind: 'profile' })}
            style={{ display: 'block', width: '100%' }}
          >
            Змінити фото та ім'я
          </button>
        </div>

        <div>
          <div className="sectionlbl">Ціль</div>
          <div className="plainrows">
            <button className="prow2" onClick={() => setEditing({ kind: 'kcal' })}>
              <span className="name">Денний ліміт калорій</span>
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
                    {!value && <span className="flagdot" />}
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
              <span className="name">Сповіщення</span>
              <span className="sub">увімк.</span>
            </div>
            <div className="prow2">
              <span className="name">Одиниці виміру</span>
              <span className="sub">метричні</span>
            </div>
            <div className="prow2">
              <span className="name">Мова</span>
              <span className="sub">українська</span>
            </div>
          </div>
        </div>
      </div>

      {editing?.kind === 'profile' && <ProfileModal onClose={() => setEditing(null)} />}
      {editing?.kind === 'kcal' && <KcalModal onClose={() => setEditing(null)} />}
      {editing?.kind === 'measure' && (
        <MeasureModal measureKey={editing.key} onClose={() => setEditing(null)} />
      )}
    </>
  )
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile } = useStore()
  const [name, setName] = useState(profile.name)
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? '')
  const { saving, error, submit } = useSubmit()

  return (
    <Modal title="Профіль" onClose={onClose}>
      <div className="field">
        <label htmlFor="p-name">Ім'я</label>
        <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="p-photo">Посилання на фото</label>
        <input
          id="p-photo"
          value={photoUrl}
          placeholder="лишити порожнім — буде градієнт"
          onChange={(e) => setPhotoUrl(e.target.value)}
        />
      </div>
      {error && <p className="form-error">{error}</p>}

      <div className="btn-row">
        <button className="btn btn-outline" onClick={onClose} disabled={saving}>
          Скасувати
        </button>
        <button
          className="btn btn-grad"
          disabled={name.trim().length === 0 || saving}
          onClick={() =>
            void submit(async () => {
              await updateProfile({ name: name.trim(), photoUrl: photoUrl.trim() || null })
              onClose()
            })
          }
        >
          {saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>
    </Modal>
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
        <button className="btn btn-outline" onClick={onClose} disabled={saving}>
          Скасувати
        </button>
        <button
          className="btn btn-grad"
          disabled={!valid || saving}
          onClick={() =>
            void submit(async () => {
              await updateProfile({ dailyKcal: parsed })
              onClose()
            })
          }
        >
          {saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>
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
      <div className="field">
        <label htmlFor="m-date">Дата</label>
        <input id="m-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
        <button className="btn btn-outline" onClick={onClose} disabled={saving}>
          Скасувати
        </button>
        <button
          className="btn btn-grad"
          disabled={!valid || saving}
          onClick={() =>
            void submit(async () => {
              await addMeasurement(measureKey, date, parsed)
              onClose()
            })
          }
        >
          {saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>
    </Modal>
  )
}
