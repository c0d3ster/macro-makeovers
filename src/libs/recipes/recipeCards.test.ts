import { describe, expect, it } from 'vitest'

import type { RecipeCardRow } from './recipeCards'

import { toCardSummary, toRecipeCard } from './recipeCards'

const row: RecipeCardRow = {
  slug: 'test-chili',
  title: 'Test Chili',
  summary: 'A test recipe',
  servings: 5,
  prep_minutes: 15,
  cook_minutes: 55,
  cost_tier: 1,
  difficulty: 2,
  recipe_nutrition: [
    {
      kind: 'makeover',
      is_default: false,
      calories: 370,
      carbs_g: 42,
      fat_g: 8,
      protein_g: 32,
    },
    {
      kind: 'makeover',
      is_default: true,
      calories: 500,
      carbs_g: 52,
      fat_g: 15,
      protein_g: 39,
    },
    {
      kind: 'traditional',
      is_default: false,
      calories: 480,
      carbs_g: 30,
      fat_g: 28,
      protein_g: 27,
    },
  ],
  recipe_tags: [
    { tags: { name: 'turkey' } },
    { tags: { name: 'chili' } },
    { tags: null },
  ],
}

describe('toRecipeCard', () => {
  it('uses the default makeover row for the macros', () => {
    expect(toRecipeCard(row)).toMatchObject({
      calories: 500,
      proteinG: 39,
      carbsG: 52,
      fatG: 15,
    })
  })

  it('adds prep and cook time and sorts the tags', () => {
    expect(toRecipeCard(row)).toMatchObject({
      totalMinutes: 70,
      tags: ['chili', 'turkey'],
    })
  })

  it('falls back to the first makeover row when none is flagged', () => {
    const unflagged: RecipeCardRow = {
      ...row,
      recipe_nutrition: row.recipe_nutrition.map((item) => ({
        ...item,
        is_default: false,
      })),
    }

    expect(toRecipeCard(unflagged)?.calories).toBe(370)
  })

  it('never uses the traditional row as the featured build', () => {
    const onlyTraditional: RecipeCardRow = {
      ...row,
      recipe_nutrition: row.recipe_nutrition.filter(
        ({ kind }) => kind === 'traditional'
      ),
    }

    expect(toRecipeCard(onlyTraditional)).toBeUndefined()
  })
})

describe('toCardSummary', () => {
  it('keeps just the first sentence', () => {
    expect(
      toCardSummary(
        'Lean turkey lacks the fat and richness beef brings, so you build it back. Big batch.'
      )
    ).toBe(
      'Lean turkey lacks the fat and richness beef brings, so you build it back.'
    )
  })

  it('keeps a short first sentence on its own', () => {
    expect(
      toCardSummary('Classic casserole, rebuilt. No cream of chicken soup.')
    ).toBe('Classic casserole, rebuilt.')
  })

  it('does not split on a decimal point', () => {
    expect(
      toCardSummary(
        'Uses 1.5 lb of beef and a long marinade for deep flavor. Second.'
      )
    ).toBe('Uses 1.5 lb of beef and a long marinade for deep flavor.')
  })

  it('returns text without a sentence end as is', () => {
    expect(toCardSummary('No punctuation here')).toBe('No punctuation here')
  })

  it('returns a short single sentence as is', () => {
    expect(toCardSummary('Short one.')).toBe('Short one.')
  })
})
