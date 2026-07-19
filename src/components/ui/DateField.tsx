import type { MouseEvent } from 'react'
import { Icon } from '@/components/ui/Icon'

/**
 * Поле вибору дати з власною іконкою календаря.
 *
 * Нативний ::-webkit-calendar-picker-indicator рендериться по-різному
 * залежно від рушія: у Chrome desktop це календар, а в мобільному
 * WebView (Telegram на Android) — стрілка, така сама, як у <select>.
 * Тому ховаємо його зовсім і малюємо свою іконку через Icon, як уже
 * зроблено для стрілки <select>.
 */
export function DateField({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  /*
   * Разом із прихованим індикатором зникає і єдиний спосіб відкрити
   * пікер на десктопі — клік по полю лише ставив би курсор у сегмент
   * дати. showPicker() кидає, якщо браузер його не підтримує або
   * вважає клік не «жестом користувача»; тоді лишається ручний ввід.
   */
  const openPicker = (e: MouseEvent<HTMLInputElement>) => {
    try {
      e.currentTarget.showPicker()
    } catch {
      /* не критично — дату можна ввести з клавіатури */
    }
  }

  return (
    <span className="date-wrap">
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={openPicker}
      />
      <span className="field-icon">
        <Icon name="calendar" />
      </span>
    </span>
  )
}
