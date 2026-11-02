import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'
import { recipeImportSchema } from '@/validations'

import type { ImportRepository } from './importRecipe'

import { importRecipe } from './importRecipe'
import { RecipeRuleError } from './recipeRuleError'

const stored = recipeImportSchema.parse(sampleRecipe)

const createRepository = (existing?: unknown): ImportRepository => ({
  getRecipeIdBySlug: vi.fn(async () => (existing ? 'recipe-1' : undefined)),
  getRecipe: vi.fn(async () => existing),
  validateRecipe: vi.fn(async () => undefined),
  createRecipe: vi.fn(async () => 'recipe-1'),
  updateRecipe: vi.fn(async () => 'recipe-1'),
})

// How many times anything was written
const writes = (repository: ImportRepository): number =>
  vi.mocked(repository.createRecipe).mock.calls.length +
  vi.mocked(repository.updateRecipe).mock.calls.length

describe('importRecipe', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reports the exact field for invalid input and writes nothing', async () => {
    const repository = createRepository()

    const result = await importRecipe(repository, { ...sampleRecipe, costTier: 9 })

    expect(result).toMatchObject({
      status: 'invalid',
      issues: [{ path: 'costTier' }],
    })
    expect(writes(repository)).toBe(0)
  })

  it('creates a recipe for a new slug', async () => {
    const repository = createRepository()

    const result = await importRecipe(repository, sampleRecipe)

    expect(result).toEqual({
      status: 'created',
      slug: 'test-chili',
      id: 'recipe-1',
    })
    expect(repository.createRecipe).toHaveBeenCalledWith(stored)
  })

  it('writes nothing on a dry run', async () => {
    const repository = createRepository()

    const result = await importRecipe(repository, sampleRecipe, { dryRun: true })

    expect(result).toEqual({ status: 'created', slug: 'test-chili' })
    expect(writes(repository)).toBe(0)
  })

  it('reports unchanged when the stored recipe already matches', async () => {
    const repository = createRepository(stored)

    const result = await importRecipe(repository, sampleRecipe)

    expect(result).toEqual({
      status: 'unchanged',
      slug: 'test-chili',
      id: 'recipe-1',
    })
    expect(writes(repository)).toBe(0)
  })

  it('returns a field-level diff instead of overwriting an existing slug', async () => {
    const repository = createRepository({ ...stored, title: 'Old title' })

    const result = await importRecipe(repository, sampleRecipe)

    expect(result).toEqual({
      status: 'conflict',
      slug: 'test-chili',
      changes: [{ path: 'title', before: 'Old title', after: 'Test Chili' }],
    })
    expect(writes(repository)).toBe(0)
  })

  it('overwrites an existing slug when asked', async () => {
    const repository = createRepository({ ...stored, title: 'Old title' })

    const result = await importRecipe(repository, sampleRecipe, { overwrite: true })

    expect(result).toMatchObject({ status: 'updated', id: 'recipe-1' })
    expect(repository.updateRecipe).toHaveBeenCalledWith('recipe-1', stored)
  })

  it('does not write an overwrite on a dry run', async () => {
    const repository = createRepository({ ...stored, title: 'Old title' })

    const result = await importRecipe(repository, sampleRecipe, {
      overwrite: true,
      dryRun: true,
    })

    expect(result).toMatchObject({ status: 'updated' })
    expect(writes(repository)).toBe(0)
  })

  it('fails loudly when the stored recipe no longer matches the schema', async () => {
    const repository = createRepository({ slug: 'test-chili' })

    await expect(importRecipe(repository, sampleRecipe)).rejects.toThrow(
      'no longer matches the import schema'
    )
  })

  describe('when editing a known recipe', () => {
    it('refuses a slug that belongs to a different recipe', async () => {
      const repository = createRepository(stored)

      const result = await importRecipe(repository, sampleRecipe, {
        overwrite: true,
        recipeId: 'someone-else',
      })

      expect(result).toMatchObject({
        status: 'invalid',
        issues: [{ path: 'slug' }],
      })
      expect(writes(repository)).toBe(0)
    })

    it('refuses a slug that no recipe has, since that is a rename', async () => {
      const repository = createRepository()

      const result = await importRecipe(repository, sampleRecipe, {
        overwrite: true,
        recipeId: 'recipe-1',
      })

      expect(result).toMatchObject({ status: 'invalid' })
      expect(writes(repository)).toBe(0)
    })

    it('saves when the slug is the recipe own', async () => {
      const repository = createRepository({ ...stored, title: 'Old title' })

      const result = await importRecipe(repository, sampleRecipe, {
        overwrite: true,
        recipeId: 'recipe-1',
      })

      expect(result).toMatchObject({ status: 'updated', id: 'recipe-1' })
    })
  })

  describe('recipe rules', () => {
    const brokenRule = new RecipeRuleError('variantOf', 'No such base')

    it('reports a broken rule as a field issue, even on a dry run', async () => {
      const repository = createRepository()
      vi.mocked(repository.validateRecipe).mockRejectedValue(brokenRule)

      const result = await importRecipe(repository, sampleRecipe, { dryRun: true })

      expect(result).toEqual({
        status: 'invalid',
        issues: [{ path: 'variantOf', message: 'No such base' }],
      })
      expect(writes(repository)).toBe(0)
    })

    it('reports a rule broken between the check and the write', async () => {
      const repository = createRepository()
      vi.mocked(repository.createRecipe).mockRejectedValue(brokenRule)

      const result = await importRecipe(repository, sampleRecipe)

      expect(result).toMatchObject({
        status: 'invalid',
        issues: [{ path: 'variantOf' }],
      })
    })

    it('still throws for failures that are not rules', async () => {
      const repository = createRepository()
      vi.mocked(repository.createRecipe).mockRejectedValue(new Error('connection lost'))

      await expect(importRecipe(repository, sampleRecipe)).rejects.toThrow(
        'connection lost'
      )
    })
  })
})
