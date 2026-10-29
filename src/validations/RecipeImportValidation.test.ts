import { describe, expect, it } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'

import { recipeImportSchema } from './RecipeImportValidation'

const [makeover, traditional] = sampleRecipe.nutrition

const issuePaths = (input: unknown): string[] => {
  const result = recipeImportSchema.safeParse(input)
  return result.success
    ? []
    : result.error.issues.map(({ path }) => path.join('.'))
}

describe('recipeImportSchema', () => {
  it('accepts a valid recipe', () => {
    expect(recipeImportSchema.safeParse(sampleRecipe).success).toBe(true)
  })

  it('normalizes tags to lowercase, unique, and sorted', () => {
    const result = recipeImportSchema.parse(sampleRecipe)

    expect(result.tags).toEqual(['chili', 'high protein'])
  })

  it('makes the first makeover row the default when none is flagged', () => {
    const result = recipeImportSchema.parse(sampleRecipe)

    expect(result.nutrition.map(({ isDefault }) => isDefault)).toEqual([
      true,
      false,
    ])
  })

  it('keeps an explicit default', () => {
    const result = recipeImportSchema.parse({
      ...sampleRecipe,
      nutrition: [makeover, { ...makeover, label: 'Loaded', isDefault: true }],
    })

    expect(result.nutrition.map(({ label }) => label)).toEqual([
      'Base only',
      'Loaded',
    ])
    expect(result.nutrition.map(({ isDefault }) => isDefault)).toEqual([
      false,
      true,
    ])
  })

  it('accepts fractional step durations', () => {
    const result = recipeImportSchema.parse(sampleRecipe)

    expect(result.steps[1]?.durationMinutes).toBe(0.25)
  })

  it('accepts a variant of another recipe but not of itself', () => {
    expect(
      recipeImportSchema.parse({ ...sampleRecipe, variantOf: 'other-recipe' })
        .variantOf
    ).toBe('other-recipe')
    expect(
      issuePaths({ ...sampleRecipe, variantOf: sampleRecipe.slug })
    ).toEqual(['variantOf'])
  })

  it('names the field when a value is out of range', () => {
    expect(issuePaths({ ...sampleRecipe, costTier: 9 })).toEqual(['costTier'])
    expect(issuePaths({ ...sampleRecipe, difficulty: 0 })).toEqual([
      'difficulty',
    ])
  })

  it('names the nested field for a bad nutrition row', () => {
    const nutrition = [{ ...makeover, calories: -5 }, traditional]

    expect(issuePaths({ ...sampleRecipe, nutrition })).toEqual([
      'nutrition.0.calories',
    ])
  })

  it('rejects a slug that is not kebab-case', () => {
    expect(issuePaths({ ...sampleRecipe, slug: 'Test Chili' })).toEqual([
      'slug',
    ])
  })

  it('requires at least one makeover row', () => {
    expect(issuePaths({ ...sampleRecipe, nutrition: [traditional] })).toEqual([
      'nutrition',
    ])
  })

  it('rejects a traditional row marked as the default', () => {
    const nutrition = [makeover, { ...traditional, isDefault: true }]

    expect(issuePaths({ ...sampleRecipe, nutrition })).toEqual([
      'nutrition.1.isDefault',
    ])
  })

  it('rejects two default rows', () => {
    const nutrition = [
      { ...makeover, isDefault: true },
      { ...makeover, label: 'Other', isDefault: true },
    ]

    expect(issuePaths({ ...sampleRecipe, nutrition })).toEqual([
      'nutrition.1.isDefault',
    ])
  })

  it('requires at least one ingredient and one step', () => {
    expect(issuePaths({ ...sampleRecipe, ingredients: [] })).toEqual([
      'ingredients',
    ])
    expect(issuePaths({ ...sampleRecipe, steps: [] })).toEqual(['steps'])
  })
})
