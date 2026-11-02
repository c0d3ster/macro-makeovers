import type { User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'

import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthContext } from './AuthContext'
import { useIsOwner } from './useIsOwner'

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('@/libs/supabase/client', () => ({
  createClient: () => ({ rpc: mocks.rpc }),
}))

const wrapperFor =
  (user: User | null) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext
      value={{ user, isLoaded: true, signOut: async (): Promise<void> => {} }}
    >
      {children}
    </AuthContext>
  )

const signedIn = { id: 'user-1' } as User

describe('useIsOwner', () => {
  beforeEach(() => {
    mocks.rpc.mockReset()
  })

  it('is false for a signed-out visitor, without asking the database', () => {
    const { result } = renderHook(() => useIsOwner(), {
      wrapper: wrapperFor(null),
    })

    expect(result.current).toBe(false)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('is true once the database says the user is the owner', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null })

    const { result } = renderHook(() => useIsOwner(), {
      wrapper: wrapperFor(signedIn),
    })

    expect(result.current).toBe(false)

    await waitFor(() => expect(result.current).toBe(true))

    expect(mocks.rpc).toHaveBeenCalledWith('is_owner')
  })

  it('is false for a member', async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null })

    const { result } = renderHook(() => useIsOwner(), {
      wrapper: wrapperFor(signedIn),
    })

    await waitFor(() => expect(mocks.rpc).toHaveBeenCalled())

    expect(result.current).toBe(false)
  })

  it('is false when the check fails', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: { message: 'nope' } })

    const { result } = renderHook(() => useIsOwner(), {
      wrapper: wrapperFor(signedIn),
    })

    await waitFor(() => expect(mocks.rpc).toHaveBeenCalled())

    expect(result.current).toBe(false)
  })
})
