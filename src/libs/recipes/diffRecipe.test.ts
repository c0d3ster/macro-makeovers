import { describe, expect, it } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'
import { recipeImportSchema } from '@/validations'

import { diffRecipes } from './diffRecipe'

const base = recipeImportSchema.parse(sampleRecipe)

describe('diffRecipes', () => {
  it('reports nothing for identical recipes', () => {
    expect(diffRecipes(base, recipeImportSchema.parse(sampleRecipe))).toEqual(
      []
    )
  })

  it('reports a changed scalar with its path', () => {
    const after = { ...base, title: 'Better Chili' }

    expect(diffRecipes(base, after)).toEqual([
      { path: 'title', before: 'Test Chili', after: 'Better Chili' },
    ])
  })

  it('reports a nested change at the exact field', () => {
    const builds = base.builds.map((row, index) =>
      index === 0 ? { ...row, proteinG: 40 } : row
    )

    expect(diffRecipes(base, { ...base, builds })).toEqual([
      { path: 'builds[0].proteinG', before: 32, after: 40 },
    ])
  })

  it('reports tags as additions and removals, not shifted positions', () => {
    const after = { ...base, tags: ['chili', 'quick'] }

    expect(diffRecipes(base, after)).toEqual([
      { path: 'tags[+]', before: undefined, after: 'quick' },
      { path: 'tags[-]', before: 'high protein', after: undefined },
    ])
  })

  it('reports added and removed array items by index', () => {
    const added = { ...base, steps: [...base.steps, ...base.steps.slice(0, 1)] }
    const removed = { ...base, ingredients: base.ingredients.slice(0, 1) }

    expect(diffRecipes(base, added)).toEqual([
      { path: 'steps[2]', before: undefined, after: base.steps[0] },
    ])
    expect(diffRecipes(base, removed)).toEqual([
      { path: 'ingredients[1]', before: base.ingredients[1], after: undefined },
    ])
  })

  // The longer recipe below has enough rows that an index-based diff would flag everything
  // after an insert
  const steps = ['Dice', 'Brown', 'Simmer', 'Season', 'Serve'].map((body) => ({
    phase: 'cook' as const,
    body,
  }))
  const long = recipeImportSchema.parse({ ...sampleRecipe, steps })

  it('reports an inserted row as one addition, not a shift of every row after it', () => {
    const inserted = [
      ...long.steps.slice(0, 1),
      { phase: 'cook' as const, body: 'Bloom the spices' },
      ...long.steps.slice(1),
    ]

    expect(diffRecipes(long, { ...long, steps: inserted })).toEqual([
      {
        path: 'steps[1]',
        before: undefined,
        after: { phase: 'cook', body: 'Bloom the spices' },
      },
    ])
  })

  it('reports a removed row once, at its old index', () => {
    const removed = long.steps.filter(({ body }) => body !== 'Brown')

    expect(diffRecipes(long, { ...long, steps: removed })).toEqual([
      { path: 'steps[1]', before: long.steps[1], after: undefined },
    ])
  })

  it('reports a field added to a row in place', () => {
    const scoped = long.steps.map((step) =>
      step.body === 'Season' ? { ...step, skipBuilds: ['base'] } : step
    )

    expect(diffRecipes(long, { ...long, steps: scoped })).toEqual([
      { path: 'steps[3].skipBuilds', before: undefined, after: ['base'] },
    ])
  })

  it('pairs an edited row with the row it replaced', () => {
    const edited = long.steps.map((step) =>
      step.body === 'Simmer' ? { ...step, body: 'Simmer 20 min' } : step
    )

    expect(diffRecipes(long, { ...long, steps: edited })).toEqual([
      { path: 'steps[2].body', before: 'Simmer', after: 'Simmer 20 min' },
    ])
  })

  it('reports a moved row as a position change', () => {
    const [first, ...rest] = long.steps
    const moved = [...rest.slice(0, 2), first, ...rest.slice(2)].filter(
      (step) => step !== undefined
    )

    expect(diffRecipes(long, { ...long, steps: moved })).toEqual([
      { path: 'steps[2].position', before: 0, after: 2 },
    ])
  })

  it('matches builds by key, so a new build does not shift the others', () => {
    const [first] = base.builds
    if (!first) throw new Error('The sample recipe has no build')
    const extra = {
      ...first,
      key: 'loaded',
      label: 'Loaded',
      isDefault: false,
      listed: true,
      calories: 500,
    }
    const after = { ...base, builds: [extra, ...base.builds] }

    expect(diffRecipes(base, after)).toEqual([
      { path: 'builds[0]', before: undefined, after: extra },
    ])
  })
})
