/**
 * Тонка обгортка над Telegram Web App SDK.
 *
 * Важливо: дані звідси НЕ можна вважати перевіреними. `initData` — це підписаний
 * рядок, і підпис має звірити бекенд (HMAC-SHA256 секретом бота). До того часу
 * це просто підказка для UI, поки не приїхав профіль з API.
 */

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

interface TelegramWebApp {
  initData: string
  initDataUnsafe?: { user?: TelegramUser }
  colorScheme?: 'light' | 'dark'
  ready: () => void
  expand: () => void
  setHeaderColor?: (color: string) => void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export const tg = (): TelegramWebApp | undefined => window.Telegram?.WebApp

/** Викликати один раз на старті: розгорнути вікно і сховати сплеш Telegram. */
export function initTelegram(): void {
  const app = tg()
  if (!app) return
  app.ready()
  app.expand()
}

/** Підписаний рядок для бекенду. Порожній — значить сайт відкрито поза Telegram. */
export const initData = (): string => tg()?.initData ?? ''

/** Ім'я та аватар для першого рендера. Джерело правди — відповідь бекенду. */
export function telegramUserHint(): { name: string; photoUrl: string | null } | null {
  const user = tg()?.initDataUnsafe?.user
  if (!user) return null
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return {
    name: name || user.username || 'Профіль',
    photoUrl: user.photo_url ?? null,
  }
}
