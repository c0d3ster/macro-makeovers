import { describe, expect, it } from 'vitest'

import type { RecipeBuildRow, RecipeDetailRow } from './recipeDetail'

import { toMetaDescription, toRecipeDetail, toRecipeView } from './recipeDetail'

const buildRow = (
  overrides: Partial<RecipeBuildRow> = {}
): RecipeBuildRow => ({
  position: 0,
  key: 'standard',
  label: 'Per serving',
  isDefault: true,
  listed: true,
  calories: 500,
  carbsG: 52,
  fatG: 15,
  proteinG: 39,
  swap: {},
  title: null,
  noteMd: null,
  costTier: null,
  difficulty: null,
  prepMinutes: null,
  cookMinutes: null,
  course: null,
  imageUrl: null,
  ...overrides,
})

const unscoped = { onlyBuilds: [], skipBuilds: [] }

const row: RecipeDetailRow = {
  id: 'recipe-1',
  slug: 'test-chili',
  title: 'Test Chili',
  summary: 'A test recipe.',
  servings: 5,
  prepMinutes: 15,
  cookMinutes: 55,
  costTier: 2,
  difficulty: 3,
  course: 'main',
  imageUrl: null,
  builds: [
    buildRow({
      position: 1,
      key: 'beef',
      label: 'Beef',
      isDefault: false,
      swap: { turkey: 'beef' },
      title: 'Beef Chili',
      noteMd: 'Beef in place of turkey',
      cookMinutes: 40,
    }),
    buildRow(),
  ],
  nutrition: [
    {
      kind: 'traditional',
      label: 'Traditional',
      position: 2,
      calories: 480,
      carbsG: 30,
      fatG: 28,
      proteinG: 27,
    },
  ],
  ingredients: [
    { groupName: null, position: 2, rawText: 'Salt', ...unscoped },
    {
      groupName: 'Base',
      position: 1,
      rawText: '1 lb turkey',
      onlyBuilds: [],
      skipBuilds: ['beef'],
    },
    {
      groupName: 'Base',
      position: 1.5,
      rawText: '1 lb beef',
      onlyBuilds: ['beef'],
      skipBuilds: [],
    },
  ],
  steps: [
    {
      phase: 'cook',
      position: 2,
      bodyMd: 'Simmer',
      durationMinutes: 30,
      ...unscoped,
    },
    {
      phase: 'prep',
      position: 1,
      bodyMd: 'Chop',
      durationMinutes: null,
      ...unscoped,
    },
  ],
  notes: [
    { kind: 'levers', position: 1, bodyMd: 'Swap beans', ...unscoped },
    {
      kind: 'fixes',
      position: 1,
      bodyMd: 'Too thin? Simmer longer',
      ...unscoped,
    },
    { kind: 'make_or_break', position: 2, bodyMd: 'Second', ...unscoped },
    { kind: 'make_or_break', position: 1, bodyMd: 'First', ...unscoped },
    {
      kind: 'nutrition_analysis',
      position: 3,
      bodyMd: 'Turkey math',
      onlyBuilds: ['standard'],
      skipBuilds: [],
    },
  ],
  recipeTags: [{ tag: { name: 'turkey' } }, { tag: { name: 'chili' } }],
}

describe('toRecipeDetail', () => {
  const detail = toRecipeDetail(row, { variants: [] })

  it('orders children by position', () => {
    expect(detail?.builds.map(({ key }) => key)).toEqual(['standard', 'beef'])
    expect(detail?.comparisons.map(({ label }) => label)).toEqual([
      'Traditional',
    ])
    expect(detail?.ingredients).toEqual([
      { group: 'Base', raw: '1 lb turkey', skipBuilds: ['beef'] },
      { group: 'Base', raw: '1 lb beef', onlyBuilds: ['beef'] },
      { raw: 'Salt' },
    ])
    expect(detail?.steps.map(({ body }) => body)).toEqual(['Chop', 'Simmer'])
  })

  it('maps the photo when there is one', () => {
    const withPhoto = toRecipeDetail(
      { ...row, imageUrl: 'https://example.com/chili.jpg' },
      { variants: [] }
    )

    expect(detail?.imageUrl).toBeUndefined()
    expect(withPhoto?.imageUrl).toBe('https://example.com/chili.jpg')
  })

  it('maps durations and tags', () => {
    expect(detail?.steps.map(({ durationMinutes }) => durationMinutes)).toEqual(
      [undefined, 30]
    )
    expect(detail?.tags).toEqual(['chili', 'turkey'])
    expect(detail?.totalMinutes).toBe(70)
  })

  it('orders notes by section, then position', () => {
    expect(detail?.notes.map(({ body }) => body)).toEqual([
      'First',
      'Second',
      'Too thin? Simmer longer',
      'Swap beans',
    ])
  })

  it('leads with the default build', () => {
    expect(detail?.featured).toMatchObject({ key: 'standard', calories: 500 })
  })

  it('carries the related recipes through', () => {
    const related = toRecipeDetail(row, {
      baseRecipe: { slug: 'base', title: 'Base' },
      variants: [{ slug: 'spicy', title: 'Spicy' }],
    })

    expect(related?.baseRecipe).toEqual({ slug: 'base', title: 'Base' })
    expect(related?.variants).toEqual([{ slug: 'spicy', title: 'Spicy' }])
  })

  it('has no page when the recipe has no build', () => {
    expect(toRecipeDetail({ ...row, builds: [] }, { variants: [] })).toBeUndefined()
  })
})

describe('toRecipeView', () => {
  const detail = toRecipeDetail(row, { variants: [] })
  if (!detail) throw new Error('The test recipe has no page')

  it('reads as the default build without a key', () => {
    const view = toRecipeView(detail)

    expect(view.build.key).toBe('standard')
    expect(view.title).toBe('Test Chili')
    expect(view.ingredients.map(({ raw }) => raw)).toEqual([
      '1 lb turkey',
      'Salt',
    ])
    expect(view.nutritionAnalysis).toEqual(['Turkey math'])
  })

  it('applies a build and its scoped lines', () => {
    const view = toRecipeView(detail, 'beef')

    expect(view).toMatchObject({
      title: 'Beef Chili',
      summary: 'A test recipe.',
      cookMinutes: 40,
      totalMinutes: 55,
      tags: ['beef', 'chili'],
    })
    expect(view.ingredients.map(({ raw }) => raw)).toEqual(['1 lb beef', 'Salt'])
    expect(view.nutritionAnalysis).toEqual([])
    expect(view.steps).toHaveLength(2)
  })

  it('falls back to the default for an unknown key', () => {
    expect(toRecipeView(detail, 'nope').build.key).toBe('standard')
  })
})

describe('toMetaDescription', () => {
  it('uses the first sentence', () => {
    expect(toMetaDescription('Short one. Another sentence.')).toBe('Short one.')
  })

  it('does not split on a decimal point', () => {
    expect(toMetaDescription('Uses 1.5 lb of beef. Second.')).toBe(
      'Uses 1.5 lb of beef.'
    )
  })

  it('caps long sentences', () => {
    const description = toMetaDescription(`${'word '.repeat(60)}end.`)

    expect(description).toHaveLength(160)
    expect(description.endsWith('...')).toBe(true)
  })

  it('falls back to the whole summary when there is no sentence end', () => {
    expect(toMetaDescription('No punctuation here')).toBe('No punctuation here')
  })
})
