import { describe, expect, it } from 'vitest'

import type { RecipeCard } from './recipeCards'

import {
  describeFilters,
  findUnavailableOptions,
  groupTags,
  searchParamsWithout,
  toSearchParams,
} from './recipeFacets'
import { parseRecipeFilters } from './recipeFilters'

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
  proteinG: 100,
  carbsG: 100,
  fatG: 22,
  ...overrides,
})

const recipes = [
  card({
    slug: 'chili',
    title: 'Chili',
    tags: ['chicken', 'stovetop', 'high protein'],
    totalMinutes: 70,
  }),
  card({ slug: 'bake', title: 'Bake', tags: ['pork', 'oven'], totalMinutes: 25 }),
]

describe('groupTags', () => {
  it('lists only the group tags that recipes carry, in group order', () => {
    expect(groupTags(recipes)).toEqual({
      meat: ['chicken', 'pork'],
      method: ['stovetop', 'oven'],
      dish: [],
      goodFor: [],
    })
  })

  it('matches tags ignoring case', () => {
    expect(groupTags([card({ tags: ['Chicken'] })]).meat).toEqual(['chicken'])
  })
})

describe('search params', () => {
  it('round-trips the filters through the URL', () => {
    const params = {
      q: 'chili',
      maxCalories: '550',
      maxMinutes: '45',
      maxCost: '3',
      maxDifficulty: '2',
      carbs: 'le35',
      fat: '25',
      protein: '35',
      meat: 'chicken',
      sort: 'cost',
    }
    const filters = parseRecipeFilters(params)

    expect(Object.fromEntries(toSearchParams(filters))).toEqual(params)
  })

  it('leaves the sort out when it is the default', () => {
    expect(toSearchParams(parseRecipeFilters({ q: 'chili' })).has('sort')).toBe(
      false
    )
    expect(
      toSearchParams(parseRecipeFilters({ q: 'chili', sort: 'title' })).get(
        'sort'
      )
    ).toBe('title')
  })

  it('can drop params for a chip', () => {
    const filters = parseRecipeFilters({ q: 'chili', maxMinutes: '45' })

    expect(
      searchParamsWithout(filters, ['maxMinutes']).toString()
    ).toBe('q=chili')
  })
})

describe('describeFilters', () => {
  it('shows a preset goal as one chip', () => {
    const chips = describeFilters(
      parseRecipeFilters({ carbs: '45', fat: '25', protein: '30' })
    )

    expect(chips).toEqual([
      {
        id: 'recomp',
        label: 'Recomp',
        params: ['carbs', 'fat', 'protein', 'maxCalories'],
      },
    ])
  })

  it('lists a custom mix and the other filters one by one', () => {
    const chips = describeFilters(
      parseRecipeFilters({
        carbs: 'le35',
        fat: '30',
        maxMinutes: '45',
        maxCost: '2',
        meat: 'beef',
      })
    )

    expect(chips.map(({ label }) => label)).toEqual([
      'Carbs 35% or less',
      'Fat ~30%',
      'Up to 45 min',
      'Cost up to $$',
      'Beef',
    ])
  })

  it('has nothing to show for no filters', () => {
    expect(describeFilters(parseRecipeFilters({ q: 'chili' }))).toEqual([])
  })
})

describe('findUnavailableOptions', () => {
  const groups = groupTags(recipes)

  it('flags options that would return nothing on top of the current filters', () => {
    const filters = parseRecipeFilters({ meat: 'chicken' })
    const unavailable = findUnavailableOptions(
      recipes,
      filters,
      new Set(),
      groups
    )

    // Chicken is the 70 minute chili, so nothing under 30 minutes is left
    expect(unavailable.maxMinutes).toEqual(['30', '45', '60'])
    expect(unavailable.method).toEqual(['oven'])
  })

  it('never flags the option that is already selected', () => {
    const filters = parseRecipeFilters({ meat: 'chicken', maxMinutes: '30' })
    const unavailable = findUnavailableOptions(
      recipes,
      filters,
      new Set(),
      groups
    )

    // 30 matches nothing for chicken, but it is the selected option so it stays pickable
    expect(unavailable.maxMinutes).toEqual(['45', '60'])
  })

  it('flags nothing for a group no recipe has tags in', () => {
    const unavailable = findUnavailableOptions(
      [card({ tags: [] })],
      parseRecipeFilters({}),
      new Set(),
      groupTags([])
    )

    expect(unavailable.meat).toBeUndefined()
    // The one 500 calorie recipe is over the 400 limit but within every other
    expect(unavailable.maxCalories).toEqual(['400'])
  })
})
