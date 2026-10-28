import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminLayout from './layout'

const mocks = vi.hoisted(() => ({
  isOwner: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('@/libs/supabase/owner', () => ({ isOwner: mocks.isOwner }))
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }))

describe('AdminLayout', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the admin pages for the owner', async () => {
    mocks.isOwner.mockResolvedValue(true)

    render(await AdminLayout({ children: <p>Admin content</p> }))

    expect(screen.getByText('Admin content')).toBeInTheDocument()
    expect(mocks.notFound).not.toHaveBeenCalled()
  })

  it('hides the admin area from anyone who is not the owner', async () => {
    mocks.isOwner.mockResolvedValue(false)

    await expect(
      AdminLayout({ children: <p>Admin content</p> })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mocks.notFound).toHaveBeenCalledOnce()
  })
})
