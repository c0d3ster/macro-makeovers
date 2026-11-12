import { describe, expect, it } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'

import type { RecipeImportInput } from './RecipeImportValidation'

import { recipeImportSchema } from './RecipeImportValidation'

type BuildInput = NonNullable<RecipeImportInput['builds']>[number]

const base: BuildInput = {
  key: 'base',
  label: 'Base only',
  calories: 370,
  carbsG: 42,
  fatG: 8,
  proteinG: 32,
}
const loaded: BuildInput = { ...base, key: 'loaded', label: 'Loaded' }
const traditional = {
  kind: 'traditional' as const,
  label: 'Traditional',
  calories: 480,
  carbsG: 30,
  fatG: 28,
  proteinG: 27,
}

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

  it('makes the first build the default when none is flagged', () => {
    const result = recipeImportSchema.parse({
      ...sampleRecipe,
      builds: [base, loaded],
    })

    expect(result.builds.map(({ isDefault }) => isDefault)).toEqual([
      true,
      false,
    ])
  })

  it('keeps an explicit default', () => {
    const result = recipeImportSchema.parse({
      ...sampleRecipe,
      builds: [base, { ...loaded, isDefault: true }],
    })

    expect(result.builds.map(({ isDefault }) => isDefault)).toEqual([
      false,
      true,
    ])
  })

  it('turns old makeover nutrition rows into builds', () => {
    const { builds: _builds, ...withoutBuilds } = sampleRecipe
    const result = recipeImportSchema.parse({
      ...withoutBuilds,
      nutrition: [
        {
          kind: 'makeover',
          label: 'Base only',
          isDefault: false,
          calories: 370,
          carbsG: 42,
          fatG: 8,
          proteinG: 32,
        },
        {
          kind: 'makeover',
          label: 'Fully loaded',
          isDefault: true,
          calories: 500,
          carbsG: 52,
          fatG: 15,
          proteinG: 39,
        },
        traditional,
      ],
    })

    expect(
      result.builds.map(({ key, label, isDefault }) => ({
        key,
        label,
        isDefault,
      }))
    ).toEqual([
      { key: 'base-only', label: 'Base only', isDefault: false },
      { key: 'fully-loaded', label: 'Fully loaded', isDefault: true },
    ])
    expect(result.nutrition).toEqual([traditional])
  })

  it('rejects makeover nutrition rows next to builds', () => {
    expect(
      issuePaths({
        ...sampleRecipe,
        nutrition: [{ ...traditional, kind: 'makeover' }],
      })
    ).toEqual(['nutrition.0.kind'])
  })

  it('requires a build', () => {
    expect(issuePaths({ ...sampleRecipe, builds: [] })).toEqual(['builds'])
  })

  it('makes keys from labels and numbers a collision', () => {
    const result = recipeImportSchema.parse({
      ...sampleRecipe,
      builds: [
        { ...base, key: undefined, label: 'Rice bowl (3/4 cup)' },
        { ...base, key: undefined, label: 'Rice bowl 3/4 cup' },
      ],
    })

    expect(result.builds.map(({ key }) => key)).toEqual([
      'rice-bowl-3-4-cup',
      'rice-bowl-3-4-cup-2',
    ])
  })

  it('rejects duplicate keys and two defaults', () => {
    expect(
      issuePaths({
        ...sampleRecipe,
        builds: [
          { ...base, isDefault: true },
          { ...base, isDefault: true },
        ],
      })
    ).toEqual(['builds.1.key', 'builds.1.isDefault'])
  })

  it('keeps the default build listed', () => {
    expect(
      issuePaths({
        ...sampleRecipe,
        builds: [{ ...base, isDefault: true, listed: false }, loaded],
      })
    ).toEqual(['builds.0.listed'])
  })

  it('checks a swap against the recipe tags', () => {
    expect(
      issuePaths({
        ...sampleRecipe,
        builds: [base, { ...loaded, swap: { beef: 'pork', chili: 'high protein' } }],
      })
    ).toEqual(['builds.1.swap.beef', 'builds.1.swap.chili'])
  })

  it('keeps a swap and drops an empty one', () => {
    const result = recipeImportSchema.parse({
      ...sampleRecipe,
      builds: [{ ...base, swap: {} }, { ...loaded, swap: { Chili: 'Stew' } }],
    })

    expect(result.builds.map(({ swap }) => swap)).toEqual([
      undefined,
      { chili: 'stew' },
    ])
  })

  it('accepts scoped lines and drops empty scopes', () => {
    const result = recipeImportSchema.parse({
      ...sampleRecipe,
      builds: [base, loaded],
      ingredients: [
        { raw: '1 lb turkey', skipBuilds: ['loaded'] },
        { raw: 'Toppings', onlyBuilds: ['loaded', 'loaded'] },
        { raw: 'Salt', onlyBuilds: [] },
      ],
    })

    expect(result.ingredients).toEqual([
      { raw: '1 lb turkey', skipBuilds: ['loaded'] },
      { raw: 'Toppings', onlyBuilds: ['loaded'] },
      { raw: 'Salt' },
    ])
  })

  it('rejects unknown keys and a row with both scopes', () => {
    expect(
      issuePaths({
        ...sampleRecipe,
        builds: [base, loaded],
        steps: [
          { phase: 'prep', body: 'Chop' },
          {
            phase: 'cook',
            body: 'Sear',
            onlyBuilds: ['nope'],
            skipBuilds: ['base'],
          },
        ],
      })
    ).toEqual(['steps.1.skipBuilds', 'steps.1.onlyBuilds'])
  })

  it('rejects a build left with no ingredients', () => {
    expect(
      issuePaths({
        ...sampleRecipe,
        builds: [base, loaded],
        ingredients: [{ raw: '1 lb turkey', onlyBuilds: ['base'] }],
      })
    ).toEqual(['builds.1.key'])
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

  it('names the nested field for a bad build', () => {
    expect(
      issuePaths({ ...sampleRecipe, builds: [{ ...base, calories: -5 }] })
    ).toEqual(['builds.0.calories'])
  })

  it('rejects a slug that is not kebab-case', () => {
    expect(issuePaths({ ...sampleRecipe, slug: 'Test Chili' })).toEqual([
      'slug',
    ])
  })

  it('requires at least one ingredient and one step', () => {
    expect(issuePaths({ ...sampleRecipe, ingredients: [] })).toEqual([
      'ingredients',
    ])
    expect(issuePaths({ ...sampleRecipe, steps: [] })).toEqual(['steps'])
  })
})

describe('recipeImportSchema courses and components', () => {
  const twoBuilds = { ...sampleRecipe, builds: [base, loaded] }
  const pico = { slug: 'corn-pico', amount: '1/2 cup' }

  it('defaults to a main with no components', () => {
    const parsed = recipeImportSchema.parse(sampleRecipe)

    expect(parsed.course).toBe('main')
    expect(parsed.components).toEqual([])
  })

  it('accepts a build with its own course', () => {
    const parsed = recipeImportSchema.parse({
      ...twoBuilds,
      course: 'side',
      builds: [base, { ...loaded, course: 'main' }],
    })

    expect(parsed.builds[1]?.course).toBe('main')
  })

  it('fills in one serving per serving for a component', () => {
    const parsed = recipeImportSchema.parse({ ...sampleRecipe, components: [pico] })

    expect(parsed.components).toEqual([{ ...pico, servingsPerServing: 1 }])
  })

  it('lists one component twice for different builds', () => {
    expect(
      issuePaths({
        ...twoBuilds,
        components: [
          { ...pico, onlyBuilds: ['base'] },
          { ...pico, amount: '3/4 cup', onlyBuilds: ['loaded'] },
        ],
      })
    ).toEqual([])
  })

  it('rejects one component twice for the same build', () => {
    expect(
      issuePaths({ ...twoBuilds, components: [pico, { ...pico, onlyBuilds: ['loaded'] }] })
    ).toEqual(['components.1.slug'])
  })

  it('rejects a recipe that uses itself', () => {
    expect(
      issuePaths({ ...sampleRecipe, components: [{ slug: sampleRecipe.slug }] })
    ).toEqual(['components.0.slug'])
  })

  it('rejects a component scoped to an unknown build', () => {
    expect(
      issuePaths({ ...sampleRecipe, components: [{ ...pico, onlyBuilds: ['nope'] }] })
    ).toEqual(['components.0.onlyBuilds'])
  })
})
