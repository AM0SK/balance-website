import { useState } from 'react'
import { ApiError } from './api'

/**
 * Обгортка над збереженням у модалках: тримає стан «зберігається»
 * і текст помилки.
 *
 * Сенс у тому, щоб невдалий запит НЕ закривав модалку мовчки: користувач
 * має побачити, що дані не збережені, і мати змогу повторити.
 */
export function useSubmit() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (action: () => Promise<void>): Promise<void> => {
    setSaving(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося зберегти')
    } finally {
      setSaving(false)
    }
  }

  return { saving, error, submit }
}
