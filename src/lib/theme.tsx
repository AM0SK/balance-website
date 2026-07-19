import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/** 'auto' — слідувати за темою пристрою, як було до появи перемикача. */
export type ThemePreference = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'balance:theme'

interface ThemeContextValue {
  preference: ThemePreference
  /** Тема, яка застосована зараз: 'auto' уже розгорнуто у справжнє значення. */
  resolved: 'light' | 'dark'
  setPreference: (value: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const readStored = (): ThemePreference => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved
  } catch {
    // Приватний режим у деяких браузерах забороняє localStorage — не привід падати.
  }
  return 'auto'
}

const systemTheme = (): 'light' | 'dark' =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStored)
  const [system, setSystem] = useState<'light' | 'dark'>(systemTheme)

  // Стежимо за темою пристрою, щоб 'auto' реагував на її зміну наживо.
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const onChange = () => setSystem(media.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolved = preference === 'auto' ? system : preference

  /*
   * data-theme проставляється завжди, навіть для 'auto'. У tokens.css правило
   * [data-theme] стоїть після @media (prefers-color-scheme), тож перекриває
   * системну тему в обидва боки — інакше вибір «світла» на темному пристрої
   * не спрацював би.
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  const setPreference = (value: ThemePreference) => {
    setPreferenceState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Не зберегли — тема все одно застосується на цей сеанс.
    }
  }

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme має викликатись усередині <ThemeProvider>')
  return value
}
