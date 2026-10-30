import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'dark'
    localStorage.clear()
  })

  afterEach(() => {
    delete document.documentElement.dataset.theme
  })

  it('marks the current theme as pressed', () => {
    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('switches the page theme and remembers it', async () => {
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Light' }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    )
  })

  it('switches back to dark', () => {
    document.documentElement.dataset.theme = 'light'
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })
})
