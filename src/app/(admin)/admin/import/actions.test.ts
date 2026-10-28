import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'

import { importRecipeAction } from './actions'

const mocks = vi.hoisted(() => ({
  isOwner: vi.fn(),
  importRecipe: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/libs/supabase/owner', () => ({ isOwner: mocks.isOwner }))
vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))
vi.mock('@/libs/recipes', () => ({
  importRecipe: mocks.importRecipe,
  createSupabaseRecipeStore: vi.fn(() => ({})),
}))

const submit = (fields: Record<string, string>): Promise<unknown> => {
  const formData = new FormData()
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value))
  return importRecipeAction({}, formData)
}

const json = JSON.stringify(sampleRecipe)

describe('importRecipeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isOwner.mockResolvedValue(true)
    mocks.importRecipe.mockResolvedValue({ status: 'created', slug: 'x' })
  })

  it('refuses anyone who is not the owner and never builds the admin client', async () => {
    mocks.isOwner.mockResolvedValue(false)

    const state = await submit({ intent: 'import', json })

    expect(state).toEqual({
      error: 'Only the site owner can import recipes.',
    })
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
    expect(mocks.importRecipe).not.toHaveBeenCalled()
  })

  it('rejects an unknown intent', async () => {
    const state = await submit({ intent: 'delete', json })

    expect(state).toEqual({ error: 'Unknown action.' })
    expect(mocks.importRecipe).not.toHaveBeenCalled()
  })

  it('asks for JSON when the box is empty', async () => {
    const state = await submit({ intent: 'import', json: '   ' })

    expect(state).toEqual({ error: 'Paste a recipe as JSON first.' })
  })

  it('explains malformed JSON', async () => {
    const state = await submit({ intent: 'import', json: '{ nope' })

    expect(state).toMatchObject({
      error: expect.stringContaining('That is not valid JSON'),
    })
    expect(mocks.importRecipe).not.toHaveBeenCalled()
  })

  it('previews as a dry run that shows what an overwrite would change', async () => {
    await submit({ intent: 'preview', json })

    expect(mocks.importRecipe).toHaveBeenCalledWith(
      expect.anything(),
      sampleRecipe,
      { dryRun: true, overwrite: true }
    )
  })

  it('saves as a draft without overwriting an existing slug', async () => {
    const state = await submit({ intent: 'import', json })

    expect(mocks.importRecipe).toHaveBeenCalledWith(
      expect.anything(),
      sampleRecipe,
      { dryRun: false, overwrite: false }
    )
    expect(state).toEqual({
      intent: 'import',
      result: { status: 'created', slug: 'x' },
    })
  })

  it('overwrites only when asked to', async () => {
    await submit({ intent: 'overwrite', json })

    expect(mocks.importRecipe).toHaveBeenCalledWith(
      expect.anything(),
      sampleRecipe,
      { dryRun: false, overwrite: true }
    )
  })

  it('reports a database failure instead of throwing', async () => {
    mocks.importRecipe.mockRejectedValue(new Error('connection refused'))

    const state = await submit({ intent: 'import', json })

    expect(state).toEqual({ error: 'connection refused' })
  })
})
