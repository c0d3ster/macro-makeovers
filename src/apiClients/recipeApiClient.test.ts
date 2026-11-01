import { describe, expect, it, vi } from 'vitest'

import { toSaveRecipeResult } from './recipeApiClient'

// The generated hooks need Apollo, which these mapping tests do not
vi.mock('@/graphql/generated/graphql', () => ({
  ImportRecipeStatus: {},
  useImportRecipeMutation: vi.fn(),
}))

describe('toSaveRecipeResult', () => {
  it('lists the fields to fix when the recipe is invalid', () => {
    const issues = [{ path: 'variantOf', message: 'No such base' }]

    expect(toSaveRecipeResult({ status: 'invalid', issues })).toEqual({
      ok: false,
      error: 'Fix these fields and save again.',
      issues,
    })
  })

  it('reports a slug clash on create', () => {
    expect(
      toSaveRecipeResult({ status: 'conflict', slug: 'chili', changes: [] })
    ).toEqual({ ok: false, error: 'A recipe with that slug already exists.' })
  })

  it('says nothing changed when the recipe matches what is stored', () => {
    expect(
      toSaveRecipeResult({ status: 'unchanged', slug: 'chili', id: 'r1' })
    ).toEqual({ ok: true, id: 'r1', slug: 'chili', summary: 'No changes to save.' })
  })

  it('says a new recipe was saved as a draft', () => {
    expect(
      toSaveRecipeResult({ status: 'created', slug: 'chili', id: 'r1' })
    ).toMatchObject({ ok: true, summary: 'Saved as a draft.' })
  })

  it('says an edit was saved', () => {
    expect(
      toSaveRecipeResult({
        status: 'updated',
        slug: 'chili',
        id: 'r1',
        changes: [],
      })
    ).toMatchObject({ ok: true, summary: 'Saved.' })
  })

  it('does not claim success when no id came back', () => {
    expect(
      toSaveRecipeResult({ status: 'created', slug: 'chili' })
    ).toEqual({ ok: false, error: 'The save did not finish.' })
  })
})
