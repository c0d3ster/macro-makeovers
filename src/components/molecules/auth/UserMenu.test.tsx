import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UserMenu } from './UserMenu'

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}))

vi.mock('@/providers', () => ({
  useAuth: () => ({ user: null, isLoaded: true, signOut: mocks.signOut }),
}))

const open = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Account menu' }))
}

describe('UserMenu', () => {
  beforeEach(() => {
    mocks.signOut.mockReset()
  })

  afterEach(cleanup)

  it('starts closed', () => {
    render(<UserMenu />)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Account menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('opens to My account and Sign out', () => {
    render(<UserMenu />)
    open()

    expect(screen.getByRole('menuitem', { name: 'My account' })).toHaveAttribute(
      'href',
      '/profile'
    )
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('signs out and closes', () => {
    render(<UserMenu />)
    open()

    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))

    expect(mocks.signOut).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the icon', () => {
    render(<UserMenu />)
    open()

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Account menu' })).toHaveFocus()
  })

  it('closes on a click outside', () => {
    render(<UserMenu />)
    open()

    fireEvent.pointerDown(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('moves between the items with the arrow keys', () => {
    render(<UserMenu />)
    open()
    const [first, last] = screen.getAllByRole('menuitem')

    expect(first).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' })

    expect(last).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' })

    expect(first).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'End' })

    expect(last).toHaveFocus()
  })
})
