import { auth } from '@clerk/nextjs/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/libs/DB'

import { UserService } from './UserService'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('@/models', () => ({ schemas: { users: { id: 'id', clerkId: 'clerkId' } } }))

const me = { id: 'user-1', clerkId: 'clerk-1', email: 'me@example.com' }

describe('UserService.getUserById', () => {
  const service = new UserService()

  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-1' } as Awaited<ReturnType<typeof auth>>)
    vi.mocked(db.query.users.findFirst).mockResolvedValue(me as never)
  })

  it('rejects a signed-out caller', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>)

    await expect(service.getUserById('user-1')).rejects.toThrow('Unauthorized')
  })

  it("refuses to return another user's row", async () => {
    await expect(service.getUserById('user-2')).rejects.toThrow('Forbidden')
  })

  it("returns the caller's own row", async () => {
    await expect(service.getUserById('user-1')).resolves.toEqual(me)
  })
})
