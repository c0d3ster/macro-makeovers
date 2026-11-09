'use client'

import type { ReactElement } from 'react'

import { useSyncExternalStore } from 'react'

type Theme = 'dark' | 'light'

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

const SunIcon = (): ReactElement => (
  <svg
    aria-hidden='true'
    viewBox='0 0 24 24'
    className='size-6'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.75'
    strokeLinecap='round'
  >
    <circle cx='12' cy='12' r='4' />
    <path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
  </svg>
)

const MoonIcon = (): ReactElement => (
  <svg
    aria-hidden='true'
    viewBox='0 0 24 24'
    className='size-6'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.75'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z' />
  </svg>
)

// One icon button in the header colors. The icon shows the current theme, the label the switch.
export const ThemeToggle = (): ReactElement => {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark')
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type='button'
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => choose(next)}
      className='flex size-9 cursor-pointer items-center justify-center rounded-full text-header-muted transition-colors hover:text-header-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
    >
      {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
