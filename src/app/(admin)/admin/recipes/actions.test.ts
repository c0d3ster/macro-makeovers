import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'

import { saveRecipeAction } from './actions'

const mocks = vi.hoisted(() => ({
  isOwner: vi.fn(),
  importRecipe: vi.fn(),
  findIdBySlug: vi.fn(),
  createAdminClient: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateRecipePages: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('../revalidateRecipePages', () => ({
  revalidateRecipePages: mocks.revalidateRecipePages,
}))
vi.mock('@/libs/supabase/owner', () => ({ isOwner: mocks.isOwner }))
vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))
vi.mock('@/libs/recipes', () => ({
  importRecipe: mocks.importRecipe,
  createSupabaseRecipeStore: vi.fn(() => ({
    findIdBySlug: mocks.findIdBySlug,
  })),
}))

describe('saveRecipeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isOwner.mockResolvedValue(true)
    mocks.findIdBySlug.mockResolvedValue('recipe-1')
    mocks.importRecipe.mockResolvedValue({
      status: 'updated',
      slug: sampleRecipe.slug,
      id: 'recipe-1',
      changes: [],
    })
  })

  it('refuses anyone who is not the owner and never builds the admin client', async () => {
    mocks.isOwner.mockResolvedValue(false)

    const result = await saveRecipeAction('recipe-1', sampleRecipe)

    expect(result).toEqual({
      ok: false,
      error: 'Only the site owner can save recipes.',
    })
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('overwrites on edit and refreshes the public pages', async () => {
    const result = await saveRecipeAction('recipe-1', sampleRecipe)

    expect(mocks.importRecipe).toHaveBeenCalledWith(
      expect.anything(),
      sampleRecipe,
      { overwrite: true }
    )
    expect(mocks.revalidateRecipePages).toHaveBeenCalledWith(sampleRecipe.slug)
    expect(result).toMatchObject({ ok: true, id: 'recipe-1', summary: 'Saved.' })
  })

  it('refuses an edit whose slug points at a different recipe', async () => {
    mocks.findIdBySlug.mockResolvedValue('someone-else')

    const result = await saveRecipeAction('recipe-1', sampleRecipe)

    expect(result).toMatchObject({ ok: false })
    expect(mocks.importRecipe).not.toHaveBeenCalled()
  })

  it('does not overwrite when creating, and reports a slug clash', async () => {
    mocks.importRecipe.mockResolvedValue({
      status: 'conflict',
      slug: sampleRecipe.slug,
      changes: [],
    })

    const result = await saveRecipeAction(undefined, sampleRecipe)

    expect(mocks.importRecipe).toHaveBeenCalledWith(
      expect.anything(),
      sampleRecipe,
      { overwrite: false }
    )
    expect(result).toEqual({
      ok: false,
      error: 'A recipe with that slug already exists.',
    })
  })

  it('passes validation issues back to the form', async () => {
    const issues = [{ path: 'title', message: 'Required' }]
    mocks.importRecipe.mockResolvedValue({ status: 'invalid', issues })

    const result = await saveRecipeAction(undefined, {})

    expect(result).toMatchObject({ ok: false, issues })
    expect(mocks.revalidateRecipePages).not.toHaveBeenCalled()
  })

  it('reports a no-op save without refreshing anything', async () => {
    mocks.importRecipe.mockResolvedValue({
      status: 'unchanged',
      slug: sampleRecipe.slug,
      id: 'recipe-1',
    })

    const result = await saveRecipeAction('recipe-1', sampleRecipe)

    expect(result).toMatchObject({ ok: true, summary: 'No changes to save.' })
    expect(mocks.revalidateRecipePages).not.toHaveBeenCalled()
  })
})
