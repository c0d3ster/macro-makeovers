import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'
import { recipeImportSchema } from '@/validations'

import type { RecipeStore } from './recipeStore'

import { importRecipe } from './importRecipe'

const stored = recipeImportSchema.parse(sampleRecipe)

const createStore = (existing?: unknown): RecipeStore => ({
  findIdBySlug: vi.fn(async () => (existing ? 'recipe-1' : undefined)),
  getSnapshot: vi.fn(async () => existing),
  write: vi.fn(async () => 'recipe-1'),
})

describe('importRecipe', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reports the exact field for invalid input and writes nothing', async () => {
    const store = createStore()

    const result = await importRecipe(store, { ...sampleRecipe, costTier: 9 })

    expect(result).toMatchObject({
      status: 'invalid',
      issues: [{ path: 'costTier' }],
    })
    expect(store.write).not.toHaveBeenCalled()
  })

  it('creates a recipe for a new slug', async () => {
    const store = createStore()

    const result = await importRecipe(store, sampleRecipe)

    expect(result).toEqual({
      status: 'created',
      slug: 'test-chili',
      id: 'recipe-1',
    })
    expect(store.write).toHaveBeenCalledWith(stored)
  })

  it('writes nothing on a dry run', async () => {
    const store = createStore()

    const result = await importRecipe(store, sampleRecipe, { dryRun: true })

    expect(result).toEqual({ status: 'created', slug: 'test-chili' })
    expect(store.write).not.toHaveBeenCalled()
  })

  it('reports unchanged when the stored recipe already matches', async () => {
    const store = createStore(stored)

    const result = await importRecipe(store, sampleRecipe)

    expect(result).toEqual({
      status: 'unchanged',
      slug: 'test-chili',
      id: 'recipe-1',
    })
    expect(store.write).not.toHaveBeenCalled()
  })

  it('returns a field-level diff instead of overwriting an existing slug', async () => {
    const store = createStore({ ...stored, title: 'Old title' })

    const result = await importRecipe(store, sampleRecipe)

    expect(result).toEqual({
      status: 'conflict',
      slug: 'test-chili',
      changes: [{ path: 'title', before: 'Old title', after: 'Test Chili' }],
    })
    expect(store.write).not.toHaveBeenCalled()
  })

  it('overwrites an existing slug when asked', async () => {
    const store = createStore({ ...stored, title: 'Old title' })

    const result = await importRecipe(store, sampleRecipe, { overwrite: true })

    expect(result).toMatchObject({ status: 'updated', id: 'recipe-1' })
    expect(store.write).toHaveBeenCalledWith(stored)
  })

  it('does not write an overwrite on a dry run', async () => {
    const store = createStore({ ...stored, title: 'Old title' })

    const result = await importRecipe(store, sampleRecipe, {
      overwrite: true,
      dryRun: true,
    })

    expect(result).toMatchObject({ status: 'updated' })
    expect(store.write).not.toHaveBeenCalled()
  })

  it('fails loudly when the stored recipe no longer matches the schema', async () => {
    const store = createStore({ slug: 'test-chili' })

    await expect(importRecipe(store, sampleRecipe)).rejects.toThrow(
      'no longer matches the import schema'
    )
  })
})
