import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/libs/DB'
import { getAuthId } from '@/libs/supabase/server'

import { UserService } from './UserService'

vi.mock('@/libs/supabase/server', () => ({ getAuthId: vi.fn() }))
vi.mock('@/models', () => ({ schemas: { users: { id: 'id', authId: 'authId' } } }))

const me = { id: 'user-1', authId: 'auth-1', email: 'me@example.com' }

// Drizzle connects as postgres and bypasses RLS, so these checks are the access control
describe('UserService.getUserById', () => {
  const service = new UserService()

  beforeEach(() => {
    vi.mocked(getAuthId).mockResolvedValue('auth-1')
    vi.mocked(db.query.users.findFirst).mockResolvedValue(me as never)
  })

  it('rejects a signed-out caller', async () => {
    vi.mocked(getAuthId).mockResolvedValue(undefined)

    await expect(service.getUserById('user-1')).rejects.toThrow('Unauthorized')
  })

  it("refuses to return another user's row", async () => {
    await expect(service.getUserById('user-2')).rejects.toThrow('Forbidden')
  })

  it("returns the caller's own row", async () => {
    await expect(service.getUserById('user-1')).resolves.toEqual(me)
  })
})
