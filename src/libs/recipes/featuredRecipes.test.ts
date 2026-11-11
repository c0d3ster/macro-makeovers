import { describe, expect, it } from 'vitest'

import { withSingleBuild } from '@/tests/fixtures/recipeCard'

import type { RecipeCard } from './recipeCards'

import { fatCut, pickFeaturedRecipes } from './featuredRecipes'

const card = (
  slug: string,
  fatG: number,
  originalFatG?: number
): RecipeCard =>
  withSingleBuild({
  slug,
  title: slug,
  summary: '',
  servings: 4,
  totalMinutes: 30,
  costTier: 1,
  difficulty: 1,
  tags: [],
  calories: 400,
  proteinG: 30,
  carbsG: 40,
  fatG,
  original:
    originalFatG === undefined
      ? undefined
      : { proteinG: 20, carbsG: 40, fatG: originalFatG },
  })

describe('fatCut', () => {
  it('is the fat saved per serving', () => {
    expect(fatCut(card('a', 10, 35))).toBe(25)
  })

  it('is zero without a traditional version or when fat went up', () => {
    expect(fatCut(card('a', 10))).toBe(0)
    expect(fatCut(card('a', 20, 15))).toBe(0)
  })
})

describe('pickFeaturedRecipes', () => {
  it('puts the biggest fat cut first and keeps the count', () => {
    const recipes = [
      card('small', 10, 15),
      card('big', 10, 50),
      card('mid', 10, 30),
    ]

    expect(pickFeaturedRecipes(recipes, 2).map(({ slug }) => slug)).toEqual([
      'big',
      'mid',
    ])
  })

  it('fills in with recipes that have no traditional version, in order', () => {
    const recipes = [
      card('plain-1', 10),
      card('cut', 10, 20),
      card('plain-2', 10),
    ]

    expect(pickFeaturedRecipes(recipes, 3).map(({ slug }) => slug)).toEqual([
      'cut',
      'plain-1',
      'plain-2',
    ])
  })
})
