import { fireEvent, render, screen } from '@testing-library/react'
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

  it('offers the other theme', () => {
    render(<ThemeToggle />)

    expect(
      screen.getByRole('button', { name: 'Switch to light theme' })
    ).toBeInTheDocument()
  })

  it('switches the page theme and remembers it', async () => {
    render(<ThemeToggle />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to light theme' })
    )

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(
      await screen.findByRole('button', { name: 'Switch to dark theme' })
    ).toBeInTheDocument()
  })

  it('switches back to dark', () => {
    document.documentElement.dataset.theme = 'light'
    render(<ThemeToggle />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to dark theme' })
    )

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })
})
