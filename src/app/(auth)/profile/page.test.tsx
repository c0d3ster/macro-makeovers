import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProfilePage from './page'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  role: vi.fn(),
  isOwner: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error('redirected')
  }),
}))

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/libs/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { role: mocks.role() } }),
        }),
      }),
    }),
  }),
}))
vi.mock('@/libs/supabase/owner', () => ({ isOwner: mocks.isOwner }))
vi.mock('@/providers', () => ({
  useAuth: () => ({ user: null, isLoaded: true, signOut: vi.fn() }),
  useIsOwner: () => false,
}))

const signedIn = (metadata: Record<string, unknown> = {}): void => {
  mocks.getUser.mockResolvedValue({
    data: { user: { email: 'cook@example.com', user_metadata: metadata } },
  })
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isOwner.mockResolvedValue(false)
    mocks.role.mockReturnValue('client')
  })

  it('shows the signed-in details as a member', async () => {
    signedIn({ full_name: 'Sam Cook' })
    render(await ProfilePage())

    expect(
      screen.getByRole('heading', { name: 'My account' })
    ).toBeInTheDocument()
    expect(screen.getByText('Sam Cook')).toBeInTheDocument()
    expect(screen.getByText('cook@example.com')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument()
  })

  it('falls back when the name is missing', async () => {
    signedIn()
    render(await ProfilePage())

    expect(screen.getByText('Not set')).toBeInTheDocument()
  })

  it('shows the owner their role and a way to manage recipes', async () => {
    signedIn()
    mocks.isOwner.mockResolvedValue(true)
    mocks.role.mockReturnValue('super_admin')
    render(await ProfilePage())

    expect(screen.getByText('Super admin')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Manage recipes' })
    ).toHaveAttribute('href', '/admin')
  })

  it('sends a signed-out visitor to sign in', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })

    await expect(ProfilePage()).rejects.toThrow('redirected')
    expect(mocks.redirect).toHaveBeenCalledWith('/login?next=/profile')
  })
})
