/** Іконки з макета. Усі — 24×24 stroke, розмір задає CSS. */
const paths = {
  home: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  ration: (
    <path d="M7 2v20M7 2a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3M17 2v20M17 2a3 3 0 0 1 3 3v11" />
  ),
  workout: <rect x="7" y="7" width="10" height="10" rx="2" />,
  steps: (
    <path d="M17 4a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM6 20l2-6 3-2 2 4 3-2" />
  ),
  stepsDetailed: (
    <path d="M17 4a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM6 20l2-6 3-2 2 4 3-2M9 12 6.5 8.5" />
  ),
  dumbbell: (
    <>
      <path d="M6.5 6.5 4 4M17.5 6.5 20 4M6.5 17.5 4 20M17.5 17.5 20 20" />
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </>
  ),
  scale: <path d="M3 17h18M3 7h18M8 7v10M16 7v10" />,
  ruler: <path d="M4 4h16v4H4zM4 16h16v4H4zM8 8v8M16 8v8" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
} as const

export type IconName = keyof typeof paths

export function Icon({ name, strokeWidth = 2 }: { name: IconName; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
      {paths[name]}
    </svg>
  )
}
