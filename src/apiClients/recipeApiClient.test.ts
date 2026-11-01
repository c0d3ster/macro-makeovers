import { describe, expect, it, vi } from 'vitest'

import {
  readAdminRecipes,
  readEditableRecipe,
  readRecipeCards,
  readRecipeDetail,
  toSaveRecipeResult,
} from './recipeApiClient'

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
    ).toEqual({
      ok: true,
      id: 'r1',
      slug: 'chili',
      summary: 'No changes to save.',
    })
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
    expect(toSaveRecipeResult({ status: 'created', slug: 'chili' })).toEqual({
      ok: false,
      error: 'The save did not finish.',
    })
  })
})

const build = {
  kind: 'makeover',
  label: 'Per serving',
  isDefault: true,
  calories: 500,
  proteinG: 39,
  carbsG: 52,
  fatG: 15,
}

const detailPayload = {
  id: 'r1',
  slug: 'chili',
  title: 'Chili',
  summary: 'A test recipe.',
  imageUrl: null,
  servings: 4,
  prepMinutes: 10,
  cookMinutes: 20,
  totalMinutes: 30,
  costTier: 2,
  difficulty: 2,
  tags: ['turkey'],
  nutrition: [build],
  featured: build,
  ingredients: [{ group: null, raw: '1 lb turkey' }],
  steps: [{ phase: 'prep', body: 'Chop', durationMinutes: null }],
  nutritionIntro: [],
  nutritionAnalysis: [],
  notes: [{ kind: 'tip', body: 'Rest it' }],
  baseRecipe: null,
  variants: [],
}

describe('readRecipeCards', () => {
  it('turns GraphQL nulls into missing values', () => {
    const [card] = readRecipeCards({
      recipeCards: [
        {
          slug: 'chili',
          title: 'Chili',
          summary: 'A test recipe.',
          imageUrl: null,
          servings: 4,
          totalMinutes: 30,
          costTier: 2,
          difficulty: 2,
          tags: ['turkey'],
          calories: 500,
          proteinG: 39,
          carbsG: 52,
          fatG: 15,
          original: null,
        },
      ],
    })

    expect(card?.imageUrl).toBeUndefined()
    expect(card?.original).toBeUndefined()
    expect(card?.tags).toEqual(['turkey'])
  })
})

describe('readRecipeDetail', () => {
  it('is undefined for an unknown recipe', () => {
    expect(readRecipeDetail({ recipe: null })).toBeUndefined()
  })

  it('maps nulls to missing values and keeps the kinds', () => {
    const detail = readRecipeDetail({ recipe: detailPayload })

    expect(detail?.imageUrl).toBeUndefined()
    expect(detail?.ingredients).toEqual([
      { group: undefined, raw: '1 lb turkey' },
    ])
    expect(detail?.steps[0]).toMatchObject({
      phase: 'prep',
      durationMinutes: undefined,
    })
    expect(detail?.featured.kind).toBe('makeover')
    expect(detail?.baseRecipe).toBeUndefined()
  })

  it('fails loudly on a kind the pages do not know', () => {
    expect(() =>
      readRecipeDetail({
        recipe: { ...detailPayload, featured: { ...build, kind: 'mystery' } },
      })
    ).toThrow('Unexpected nutrition kind "mystery"')
  })
})

describe('readAdminRecipes and readEditableRecipe', () => {
  it('narrows the status', () => {
    const [row] = readAdminRecipes({
      adminRecipes: [
        {
          id: 'r1',
          slug: 'chili',
          title: 'Chili',
          status: 'published',
          updatedAt: '2026-11-01T12:00:00.000Z',
        },
      ],
    })

    expect(row?.status).toBe('published')
    expect(() =>
      readAdminRecipes({
        adminRecipes: [
          {
            id: 'r1',
            slug: 'chili',
            title: 'Chili',
            status: 'archived',
            updatedAt: '',
          },
        ],
      })
    ).toThrow('Unexpected recipe status')
  })

  it('is undefined for an unknown recipe and carries the recipe otherwise', () => {
    expect(readEditableRecipe({ editableRecipe: null })).toBeUndefined()
    expect(
      readEditableRecipe({
        editableRecipe: {
          id: 'r1',
          status: 'draft',
          recipe: { slug: 'chili' },
        },
      })
    ).toEqual({ status: 'draft', recipe: { slug: 'chili' } })
  })
})
