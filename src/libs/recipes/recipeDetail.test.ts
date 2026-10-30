import { describe, expect, it } from 'vitest'

import type { NutritionBuild, RecipeDetailRow } from './recipeDetail'

import {
  compareBuilds,
  featuredBuild,
  toMetaDescription,
  toRecipeDetail,
} from './recipeDetail'

const row: RecipeDetailRow = {
  id: 'recipe-1',
  slug: 'test-chili',
  title: 'Test Chili',
  summary: 'A test recipe.',
  servings: 5,
  prep_minutes: 15,
  cook_minutes: 55,
  cost_tier: 2,
  difficulty: 3,
  variant_of: null,
  recipe_nutrition: [
    {
      kind: 'traditional',
      label: 'Traditional',
      is_default: false,
      position: 2,
      calories: 480,
      carbs_g: 30,
      fat_g: 28,
      protein_g: 27,
    },
    {
      kind: 'makeover',
      label: 'Per serving',
      is_default: true,
      position: 1,
      calories: 500,
      carbs_g: 52,
      fat_g: 15,
      protein_g: 39,
    },
  ],
  ingredients: [
    { group_name: null, position: 2, raw_text: 'Salt' },
    { group_name: 'Base', position: 1, raw_text: '1 lb turkey' },
  ],
  steps: [
    { phase: 'cook', position: 2, body_md: 'Simmer', duration_minutes: 30 },
    { phase: 'prep', position: 1, body_md: 'Chop', duration_minutes: null },
  ],
  recipe_notes: [
    { kind: 'levers', position: 1, body_md: 'Swap beans' },
    { kind: 'fixes', position: 1, body_md: 'Too thin? Simmer longer' },
    { kind: 'make_or_break', position: 2, body_md: 'Second' },
    { kind: 'make_or_break', position: 1, body_md: 'First' },
  ],
  recipe_tags: [
    { tags: { name: 'turkey' } },
    { tags: { name: 'chili' } },
    { tags: null },
  ],
}

describe('toRecipeDetail', () => {
  const detail = toRecipeDetail(row, { variants: [] })

  it('orders children by position', () => {
    expect(detail?.nutrition.map(({ kind }) => kind)).toEqual([
      'makeover',
      'traditional',
    ])
    expect(detail?.ingredients).toEqual([
      { group: 'Base', raw: '1 lb turkey' },
      { group: undefined, raw: 'Salt' },
    ])
    expect(detail?.steps.map(({ body }) => body)).toEqual(['Chop', 'Simmer'])
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

  it('leads with the default makeover', () => {
    expect(detail?.featured).toMatchObject({ calories: 500, proteinG: 39 })
  })

  it('carries the related recipes through', () => {
    const related = toRecipeDetail(row, {
      baseRecipe: { slug: 'base', title: 'Base' },
      variants: [{ slug: 'spicy', title: 'Spicy' }],
    })

    expect(related?.baseRecipe).toEqual({ slug: 'base', title: 'Base' })
    expect(related?.variants).toEqual([{ slug: 'spicy', title: 'Spicy' }])
  })

  it('has no page when the recipe has no makeover build', () => {
    const traditionalOnly = {
      ...row,
      recipe_nutrition: row.recipe_nutrition.filter(
        ({ kind }) => kind === 'traditional'
      ),
    }

    expect(toRecipeDetail(traditionalOnly, { variants: [] })).toBeUndefined()
  })
})

describe('featuredBuild', () => {
  const build = (overrides: Partial<NutritionBuild>): NutritionBuild => ({
    kind: 'makeover',
    label: 'Per serving',
    isDefault: false,
    calories: 400,
    proteinG: 30,
    carbsG: 40,
    fatG: 10,
    ...overrides,
  })

  it('falls back to the first makeover when none is flagged default', () => {
    const first = build({ label: 'First' })

    expect(
      featuredBuild([build({ kind: 'traditional' }), first, build({})])
    ).toBe(first)
  })
})

describe('compareBuilds', () => {
  it('reports the makeover minus the traditional build', () => {
    const [makeover, traditional] =
      toRecipeDetail(row, { variants: [] })?.nutrition ?? []
    if (!makeover || !traditional) throw new Error('fixture needs two builds')

    expect(compareBuilds(makeover, traditional)).toEqual({
      calories: 20,
      proteinG: 12,
      carbsG: 22,
      fatG: -13,
    })
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
