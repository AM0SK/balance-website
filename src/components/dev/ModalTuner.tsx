import { useEffect, useState } from 'react'

/**
 * Панель підбору вигляду модалки в темній темі. ТІЛЬКИ для розробки:
 * монтується під `import.meta.env.DEV`, у бойову збірку не потрапляє
 * (перевірено — рядків цього файлу в dist немає).
 *
 * Крутить ті самі змінні, що лежать у tokens.css (--dark-modal-*),
 * виставляючи їх інлайном на <html>. Підібрані значення показує
 * готовим блоком CSS — його лишається вставити в tokens.css, щоб
 * зміни стали постійними й поїхали на бойовий.
 *
 * Стилі тут інлайнові навмисно: щоб цей інструмент не додав жодного
 * байта у components.css, який іде користувачам.
 */

const STORAGE_KEY = 'balance:modal-tuner'

interface Knobs {
  sheetHex: string
  sheetAlpha: number
  sheetBlur: number
  overlayHex: string
  overlayAlpha: number
  overlayBlur: number
}

const VARS = {
  sheetHex: '--dark-modal-sheet-rgb',
  sheetAlpha: '--dark-modal-sheet-alpha',
  sheetBlur: '--dark-modal-sheet-blur',
  overlayHex: '--dark-modal-overlay-rgb',
  overlayAlpha: '--dark-modal-overlay-alpha',
  overlayBlur: '--dark-modal-overlay-blur',
} as const

const hexToTriple = (hex: string): string => {
  const n = Number.parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const tripleToHex = (triple: string): string => {
  const [r, g, b] = triple.trim().split(/\s+/).map(Number)
  if ([r, g, b].some((v) => !Number.isFinite(v))) return '#FFFFFF'
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** Дефолти читаємо з самих токенів, щоб не дублювати значення в двох місцях. */
const readDefaults = (): Knobs => {
  const cs = getComputedStyle(document.documentElement)
  const num = (name: string, fallback: number): number => {
    const parsed = Number.parseFloat(cs.getPropertyValue(name))
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return {
    sheetHex: tripleToHex(cs.getPropertyValue(VARS.sheetHex) || '255 255 255'),
    sheetAlpha: num(VARS.sheetAlpha, 5),
    sheetBlur: num(VARS.sheetBlur, 5),
    overlayHex: tripleToHex(cs.getPropertyValue(VARS.overlayHex) || '2 2 2'),
    overlayAlpha: num(VARS.overlayAlpha, 22),
    overlayBlur: num(VARS.overlayBlur, 10),
  }
}

export function ModalTuner() {
  const [open, setOpen] = useState(false)
  const [showCss, setShowCss] = useState(false)
  const [copied, setCopied] = useState(false)
  const [defaults] = useState<Knobs>(readDefaults)
  const [knobs, setKnobs] = useState<Knobs>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return { ...readDefaults(), ...(JSON.parse(saved) as Partial<Knobs>) }
      } catch {
        /* зіпсований запис — просто беремо дефолти */
      }
    }
    return readDefaults()
  })

  // Тема, щоб попередити: крутилки діють лише в темній.
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const check = () =>
      setIsDark(
        document.documentElement.dataset.theme === 'dark' ||
          (!document.documentElement.dataset.theme &&
            matchMedia('(prefers-color-scheme: dark)').matches),
      )
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty(VARS.sheetHex, hexToTriple(knobs.sheetHex))
    root.style.setProperty(VARS.sheetAlpha, `${knobs.sheetAlpha}%`)
    root.style.setProperty(VARS.sheetBlur, `${knobs.sheetBlur}px`)
    root.style.setProperty(VARS.overlayHex, hexToTriple(knobs.overlayHex))
    root.style.setProperty(VARS.overlayAlpha, `${knobs.overlayAlpha}%`)
    root.style.setProperty(VARS.overlayBlur, `${knobs.overlayBlur}px`)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(knobs))
  }, [knobs])

  const reset = () => {
    const root = document.documentElement
    Object.values(VARS).forEach((v) => root.style.removeProperty(v))
    localStorage.removeItem(STORAGE_KEY)
    setKnobs(defaults)
  }

  const css = [
    `  --dark-modal-sheet-rgb: ${hexToTriple(knobs.sheetHex)};`,
    `  --dark-modal-sheet-alpha: ${knobs.sheetAlpha}%;`,
    `  --dark-modal-sheet-blur: ${knobs.sheetBlur}px;`,
    ``,
    `  --dark-modal-overlay-rgb: ${hexToTriple(knobs.overlayHex)};`,
    `  --dark-modal-overlay-alpha: ${knobs.overlayAlpha}%;`,
    `  --dark-modal-overlay-blur: ${knobs.overlayBlur}px;`,
  ].join('\n')

  const set = <K extends keyof Knobs>(key: K, value: Knobs[K]) =>
    setKnobs((prev) => ({ ...prev, [key]: value }))

  if (!open) {
    return (
      <button style={S.fab} onClick={() => setOpen(true)} title="Налаштувати модалку">
        🎛
      </button>
    )
  }

  return (
    <div style={S.panel}>
      <div style={S.head}>
        <b>Модалка · темна тема</b>
        <button style={S.x} onClick={() => setOpen(false)}>
          ✕
        </button>
      </div>

      {!isDark && (
        <div style={S.warn}>Увімкніть темну тему в Налаштуваннях — інакше змін не видно.</div>
      )}

      <div style={S.group}>Картка модалки</div>
      <Row label="Колір">
        <input
          type="color"
          value={knobs.sheetHex}
          onChange={(e) => set('sheetHex', e.target.value)}
          style={S.color}
        />
      </Row>
      <Slider
        label="Прозорість"
        value={knobs.sheetAlpha}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => set('sheetAlpha', v)}
      />
      <Slider
        label="Розмиття"
        value={knobs.sheetBlur}
        min={0}
        max={40}
        unit="px"
        onChange={(v) => set('sheetBlur', v)}
      />

      <div style={S.group}>Тло навколо</div>
      <Row label="Колір">
        <input
          type="color"
          value={knobs.overlayHex}
          onChange={(e) => set('overlayHex', e.target.value)}
          style={S.color}
        />
      </Row>
      <Slider
        label="Прозорість"
        value={knobs.overlayAlpha}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => set('overlayAlpha', v)}
      />
      <Slider
        label="Розмиття"
        value={knobs.overlayBlur}
        min={0}
        max={40}
        unit="px"
        onChange={(v) => set('overlayBlur', v)}
      />

      {/* Блок CSS згорнутий: розгорнутий, він займав пів екрана і затуляв
          саму модалку, вигляд якої тут і підбирають. */}
      {showCss && <pre style={S.code}>{css}</pre>}

      <div style={S.actions}>
        <button
          style={S.btn}
          onClick={() => {
            void navigator.clipboard?.writeText(css)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? '✓ Скопійовано' : 'Скопіювати CSS'}
        </button>
        <button style={S.btn} onClick={() => setShowCss((v) => !v)}>
          {showCss ? 'Сховати' : 'Показати'}
        </button>
        <button style={S.btn} onClick={reset}>
          Скинути
        </button>
      </div>
      <div style={S.hint}>Вставити в tokens.css, блок «КРУТИЛКИ».</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={S.row}>
      <span style={S.label}>{label}</span>
      {children}
    </label>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <label style={S.row}>
      <span style={S.label}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={S.range}
      />
      <span style={S.value}>
        {value}
        {unit}
      </span>
    </label>
  )
}

const S: Record<string, React.CSSProperties> = {
  fab: {
    position: 'fixed',
    left: 10,
    bottom: 104,
    zIndex: 100,
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: '1px solid rgba(128,128,128,.4)',
    background: '#1b1a22',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
  },
  panel: {
    position: 'fixed',
    left: 8,
    right: 8,
    bottom: 8,
    zIndex: 100,
    maxHeight: '70dvh',
    overflowY: 'auto',
    padding: 12,
    borderRadius: 14,
    background: '#16151c',
    color: '#EDEAF5',
    border: '1px solid rgba(255,255,255,.15)',
    boxShadow: '0 20px 50px rgba(0,0,0,.6)',
    font: '12px/1.4 system-ui, sans-serif',
  },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  x: {
    background: 'transparent',
    border: 0,
    color: '#EDEAF5',
    fontSize: 14,
    cursor: 'pointer',
    padding: 4,
  },
  warn: {
    background: 'rgba(229,136,115,.18)',
    color: '#E58873',
    padding: '6px 8px',
    borderRadius: 8,
    marginBottom: 8,
  },
  group: { marginTop: 10, marginBottom: 4, opacity: 0.6, textTransform: 'uppercase', fontSize: 10 },
  row: { display: 'flex', alignItems: 'center', gap: 8, margin: '5px 0' },
  label: { width: 80, flexShrink: 0, opacity: 0.85 },
  range: { flex: 1, minWidth: 0 },
  value: { width: 42, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  color: { width: 44, height: 24, padding: 0, border: 0, background: 'none', cursor: 'pointer' },
  code: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    background: 'rgba(255,255,255,.06)',
    fontSize: 11,
    whiteSpace: 'pre-wrap',
    userSelect: 'all',
  },
  actions: { display: 'flex', gap: 8, marginTop: 8 },
  btn: {
    flex: 1,
    padding: '7px 8px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,.2)',
    background: 'rgba(255,255,255,.08)',
    color: '#EDEAF5',
    cursor: 'pointer',
    fontSize: 12,
  },
  hint: { marginTop: 6, opacity: 0.55, fontSize: 11 },
}
