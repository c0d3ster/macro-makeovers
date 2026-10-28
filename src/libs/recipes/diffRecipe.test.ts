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
    const nutrition = base.nutrition.map((row, index) =>
      index === 0 ? { ...row, proteinG: 40 } : row
    )

    expect(diffRecipes(base, { ...base, nutrition })).toEqual([
      { path: 'nutrition[0].proteinG', before: 32, after: 40 },
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
})
