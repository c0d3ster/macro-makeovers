import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setStatusAction } from './actions'

const mocks = vi.hoisted(() => ({
  isOwner: vi.fn(),
  setRecipeStatus: vi.fn(),
  createAdminClient: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateRecipePages: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/libs/supabase/owner', () => ({ isOwner: mocks.isOwner }))
vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))
vi.mock('./revalidateRecipePages', () => ({
  revalidateRecipePages: mocks.revalidateRecipePages,
}))
vi.mock('@/libs/recipes', () => ({ setRecipeStatus: mocks.setRecipeStatus }))

const submit = (fields: Record<string, string>): Promise<void> => {
  const formData = new FormData()
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value))
  return setStatusAction(formData)
}

describe('setStatusAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isOwner.mockResolvedValue(true)
    mocks.setRecipeStatus.mockResolvedValue('test-chili')
  })

  it('refuses anyone who is not the owner and never builds the admin client', async () => {
    mocks.isOwner.mockResolvedValue(false)

    await expect(submit({ id: 'abc', status: 'published' })).rejects.toThrow(
      'Only the site owner'
    )
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('rejects an unknown status', async () => {
    await expect(submit({ id: 'abc', status: 'archived' })).rejects.toThrow(
      'Unknown recipe or status'
    )
    expect(mocks.setRecipeStatus).not.toHaveBeenCalled()
  })

  it('publishes and refreshes the pages the recipe appears on', async () => {
    await submit({ id: 'abc', status: 'published' })

    expect(mocks.setRecipeStatus).toHaveBeenCalledWith(
      undefined,
      'abc',
      'published'
    )
    expect(mocks.revalidateRecipePages).toHaveBeenCalledWith('test-chili')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin')
  })
})
