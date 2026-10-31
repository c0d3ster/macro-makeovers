import { describe, expect, it } from 'vitest'

import type { RecipeCard } from './recipeCards'

import {
  collectTags,
  countActiveFilters,
  countBarFilters,
  defaultSort,
  filterRecipes,
  parseRecipeFilters,
} from './recipeFilters'

const card = (overrides: Partial<RecipeCard>): RecipeCard => ({
  slug: 'a',
  title: 'A',
  summary: 'A summary',
  servings: 4,
  totalMinutes: 30,
  costTier: 2,
  difficulty: 2,
  tags: [],
  calories: 500,
  proteinG: 30,
  carbsG: 50,
  fatG: 15,
  ...overrides,
})

// Grams that give these shares of macro calories on a 1000 calorie base
const shares = (
  carbs: number,
  fat: number,
  protein: number
): Pick<RecipeCard, 'carbsG' | 'fatG' | 'proteinG'> => ({
  carbsG: carbs * 2.5,
  fatG: (fat * 10) / 9,
  proteinG: protein * 2.5,
})

const recipes = [
  card({
    slug: 'chili',
    title: 'Chili',
    tags: ['Comfort', 'Beef'],
    calories: 400,
    totalMinutes: 70,
    costTier: 1,
  }),
  card({
    slug: 'burrito',
    title: 'Burrito',
    tags: ['Mexican'],
    calories: 600,
    totalMinutes: 25,
    costTier: 3,
    difficulty: 4,
  }),
  card({
    slug: 'alfredo',
    title: 'Alfredo',
    summary: 'Creamy pasta',
    tags: ['Comfort', 'Pasta'],
    calories: 550,
    totalMinutes: 25,
    costTier: 2,
  }),
]

const slugs = (list: RecipeCard[]): string[] => list.map(({ slug }) => slug)

describe('parseRecipeFilters', () => {
  it('defaults to A to Z with nothing set', () => {
    const filters = parseRecipeFilters({})

    expect(filters.sort).toBe('title')
    expect(countActiveFilters(filters)).toBe(0)
  })

  it('reads limits, text and tag from search params', () => {
    const filters = parseRecipeFilters({
      q: ' pasta ',
      tag: 'Comfort',
      maxCalories: '600',
      maxMinutes: '30',
      maxCost: '2',
      maxDifficulty: '3',
      sort: 'time',
    })

    expect(filters).toEqual({
      q: 'pasta',
      tag: 'comfort',
      maxCalories: 600,
      maxMinutes: 30,
      maxCostTier: 2,
      maxDifficulty: 3,
      sort: 'time',
    })
    expect(countActiveFilters(filters)).toBe(6)
  })

  it('reads macro targets and tag groups', () => {
    const filters = parseRecipeFilters({
      carbs: 'le35',
      fat: '25',
      protein: 'ge30',
      meat: 'Chicken',
      goodFor: 'batch friendly',
    })

    expect(filters.carbs).toEqual({ kind: 'atMost', value: 35 })
    expect(filters.fat).toEqual({ kind: 'near', value: 25 })
    expect(filters.protein).toEqual({ kind: 'atLeast', value: 30 })
    expect(filters.meat).toBe('chicken')
    expect(filters.goodFor).toBe('batch friendly')
  })

  it('drops junk and out-of-range values', () => {
    const filters = parseRecipeFilters({
      maxCalories: 'lots',
      maxCost: '9',
      maxDifficulty: '0',
      carbs: 'about 40',
      sort: 'nonsense',
    })

    expect(countActiveFilters(filters)).toBe(0)
    expect(filters.sort).toBe('title')
  })

  it('uses the first value when a param repeats', () => {
    expect(
      parseRecipeFilters({ maxCalories: ['500', '700'] }).maxCalories
    ).toBe(500)
  })
})

describe('sort defaults', () => {
  it('defaults to Best match when there is search text or a macro target', () => {
    expect(parseRecipeFilters({ q: 'chicken' }).sort).toBe('match')
    expect(parseRecipeFilters({ carbs: '40' }).sort).toBe('match')
    expect(defaultSort(parseRecipeFilters({ fat: '25' }))).toBe('match')
  })

  it('lets an explicit sort win over Best match', () => {
    expect(parseRecipeFilters({ q: 'chicken', sort: 'cost' }).sort).toBe('cost')
  })

  it('ignores Best match when there is nothing to match', () => {
    expect(parseRecipeFilters({ sort: 'match' }).sort).toBe('title')
  })
})

describe('counting filters', () => {
  it('leaves search text and a tag page tag out of the filter bar badge', () => {
    const filters = parseRecipeFilters({
      q: 'pasta',
      tag: 'comfort',
      maxMinutes: '45',
      carbs: '40',
    })

    expect(countActiveFilters(filters)).toBe(4)
    expect(countBarFilters(filters)).toBe(2)
  })
})

describe('filterRecipes', () => {
  const base = parseRecipeFilters({})

  it('sorts A to Z by default', () => {
    expect(slugs(filterRecipes(recipes, base))).toEqual([
      'alfredo',
      'burrito',
      'chili',
    ])
  })

  it('applies every limit together', () => {
    const filters = {
      ...base,
      maxCalories: 560,
      maxMinutes: 30,
      maxCostTier: 2,
    }

    expect(slugs(filterRecipes(recipes, filters))).toEqual(['alfredo'])
  })

  it('filters by tag ignoring case', () => {
    const filters = { ...base, tag: 'comfort' }

    expect(slugs(filterRecipes(recipes, filters))).toEqual(['alfredo', 'chili'])
  })

  it('filters by tag group', () => {
    expect(slugs(filterRecipes(recipes, { ...base, meat: 'beef' }))).toEqual([
      'chili',
    ])
  })

  it('matches every search word against title, summary and tags', () => {
    expect(
      slugs(filterRecipes(recipes, { ...base, q: 'creamy comfort' }))
    ).toEqual(['alfredo'])
    expect(filterRecipes(recipes, { ...base, q: 'sushi' })).toEqual([])
  })

  it('also matches recipes whose ingredients matched the search', () => {
    const filters = { ...base, q: 'salmon' }

    expect(filterRecipes(recipes, filters)).toEqual([])
    expect(slugs(filterRecipes(recipes, filters, new Set(['chili'])))).toEqual([
      'chili',
    ])
  })

  it('sorts by the chosen field and breaks ties A to Z', () => {
    expect(slugs(filterRecipes(recipes, { ...base, sort: 'time' }))).toEqual([
      'alfredo',
      'burrito',
      'chili',
    ])
    expect(
      slugs(filterRecipes(recipes, { ...base, sort: 'calories' }))
    ).toEqual(['chili', 'alfredo', 'burrito'])
  })

  it('does not mutate the input list', () => {
    const before = slugs(recipes)
    filterRecipes(recipes, { ...base, sort: 'calories' })

    expect(slugs(recipes)).toEqual(before)
  })
})

describe('macro targets', () => {
  const macros = [
    card({ slug: 'exact', title: 'Exact', ...shares(45, 25, 30) }),
    card({ slug: 'close', title: 'Close', ...shares(42, 27, 31) }),
    card({ slug: 'far', title: 'Far', ...shares(30, 40, 30) }),
    card({ slug: 'low-carb', title: 'Low carb', ...shares(25, 40, 35) }),
  ]

  it('keeps recipes within four points of a target', () => {
    const filters = parseRecipeFilters({ carbs: '45', fat: '25', protein: '30' })

    expect(slugs(filterRecipes(macros, filters))).toEqual(['exact', 'close'])
  })

  it('treats "or less" and "or more" as open-ended', () => {
    const atMost = parseRecipeFilters({ carbs: 'le35' })
    const atLeast = parseRecipeFilters({ carbs: 'ge45' })

    // Best match is the default here, and "35 or less" puts the fewest carbs first
    expect(slugs(filterRecipes(macros, atMost))).toEqual(['low-carb', 'far'])
    expect(slugs(filterRecipes(macros, atLeast))).toEqual(['exact'])
  })
})

describe('Best match', () => {
  const macros = [
    card({ slug: 'near', title: 'Near', calories: 700, ...shares(44, 26, 30) }),
    card({ slug: 'exact', title: 'Exact', calories: 650, ...shares(45, 25, 30) }),
    card({ slug: 'off', title: 'Off', calories: 400, ...shares(41, 28, 31) }),
  ]

  it('puts the recipe closest to the targets first', () => {
    const filters = parseRecipeFilters({ carbs: '45', fat: '25', protein: '30' })

    expect(slugs(filterRecipes(macros, filters))).toEqual([
      'exact',
      'near',
      'off',
    ])
  })

  it('sorts a fewest-first target by the extreme', () => {
    const lowCarb = [
      card({ slug: 'a', title: 'A', ...shares(30, 35, 35) }),
      card({ slug: 'b', title: 'B', ...shares(20, 40, 40) }),
    ]

    expect(
      slugs(filterRecipes(lowCarb, parseRecipeFilters({ carbs: 'le35' })))
    ).toEqual(['b', 'a'])
  })

  it('ranks title hits above tag and summary hits', () => {
    const found = [
      card({ slug: 'summary', title: 'Zeta', summary: 'with chicken' }),
      card({ slug: 'tag', title: 'Yankee', tags: ['chicken'] }),
      card({ slug: 'title', title: 'Chicken soup' }),
    ]

    expect(
      slugs(filterRecipes(found, parseRecipeFilters({ q: 'chicken' })))
    ).toEqual(['title', 'tag', 'summary'])
  })

  it('does not override an explicitly chosen sort', () => {
    const filters = parseRecipeFilters({
      carbs: '45',
      fat: '25',
      protein: '30',
      sort: 'calories',
    })

    expect(slugs(filterRecipes(macros, filters))).toEqual([
      'off',
      'exact',
      'near',
    ])
  })
})

describe('collectTags', () => {
  it('returns each tag once, A to Z', () => {
    expect(collectTags(recipes)).toEqual([
      'Beef',
      'Comfort',
      'Mexican',
      'Pasta',
    ])
  })
})
