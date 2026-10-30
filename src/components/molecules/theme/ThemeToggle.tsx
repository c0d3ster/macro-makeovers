'use client'

import type { ReactElement } from 'react'

import { useSyncExternalStore } from 'react'

type Theme = 'dark' | 'light'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

// The root layout sets data-theme before first paint, so the page is the source of truth
const readTheme = (): Theme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'

const subscribe = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  return () => observer.disconnect()
}

const choose = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Storage can be blocked. The choice still applies for this visit.
  }
}

// Sits on the dark header, so it uses the header colors in both themes
export const ThemeToggle = (): ReactElement => {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark')

  return (
    <div
      role='group'
      aria-label='Color theme'
      className='flex items-center gap-0.5 rounded-full border border-header-muted/40 p-0.5'
    >
      {THEMES.map(({ value, label }) => (
        <button
          key={value}
          type='button'
          aria-pressed={theme === value}
          onClick={() => choose(value)}
          className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:px-2.5 ${theme === value ? 'bg-primary text-on-primary' : 'text-header-muted hover:text-header-text'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
