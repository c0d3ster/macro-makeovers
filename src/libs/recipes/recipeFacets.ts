import type { RecipeCard } from './recipeCards'
import type { RecipeFilters, TagFacet } from './recipeFilters'
import type { MacroTarget } from './recipeMacros'

import { defaultSort, filterRecipes } from './recipeFilters'
import { GOALS } from './recipeGoals'
import { formatMacroTarget } from './recipeMacros'

// Which tags belong to which picker. Tags are free text in the data, so the grouping lives
// here until tags carry a kind of their own.
const TAG_GROUPS: Record<TagFacet, string[]> = {
  meat: ['beef', 'chicken', 'pork', 'seafood', 'turkey'],
  method: [
    'stovetop',
    'oven',
    'bake',
    'sheet pan',
    'air fryer',
    'blender',
    'broiler',
  ],
  dish: ['pasta', 'rice', 'bowl', 'sandwich', 'chili'],
  goodFor: ['batch friendly', 'comfort food', 'freezer friendly'],
}

export type TagGroups = Record<TagFacet, string[]>

// The group entries that at least one recipe actually carries
export const groupTags = (recipes: RecipeCard[]): TagGroups => {
  const inUse = new Set(
    recipes.flatMap(({ tags }) => tags.map((tag) => tag.toLowerCase()))
  )
  const pick = (facet: TagFacet): string[] =>
    TAG_GROUPS[facet].filter((name) => inUse.has(name))

  return {
    meat: pick('meat'),
    method: pick('method'),
    dish: pick('dish'),
    goodFor: pick('goodFor'),
  }
}

// Filter bar controls that hide recipes, named after their URL params. The macro dropdowns
// are not here: they rank and tag, so no choice of theirs can leave an empty list.
export type FacetKey =
  | 'maxCalories'
  | 'maxMinutes'
  | 'maxCost'
  | 'maxDifficulty'
  | TagFacet

export type UnavailableOptions = Partial<Record<FacetKey, string[]>>

// The fixed choices of each hiding control, in URL form
export const FACET_VALUES = {
  maxCalories: ['400', '500', '550', '600', '700'],
  maxMinutes: ['30', '45', '60', '90'],
  maxCost: ['1', '2', '3', '4', '5'],
  maxDifficulty: ['1', '2', '3', '4', '5'],
}

// The macro dropdowns' choices: "35" is near 35, "le35" is 35 or less, "ge45" is 45 or more
export const MACRO_VALUES = {
  carbs: ['le35', '35', '40', '45', 'ge40', 'ge45'],
  fat: ['20', '25', '30', '35'],
  protein: ['25', '30', '35', '40'],
}

const APPLIERS: Record<
  FacetKey,
  (filters: RecipeFilters, value: string) => RecipeFilters
> = {
  maxCalories: (filters, value) => ({ ...filters, maxCalories: Number(value) }),
  maxMinutes: (filters, value) => ({ ...filters, maxMinutes: Number(value) }),
  maxCost: (filters, value) => ({ ...filters, maxCostTier: Number(value) }),
  maxDifficulty: (filters, value) => ({
    ...filters,
    maxDifficulty: Number(value),
  }),
  meat: (filters, value) => ({ ...filters, meat: value }),
  method: (filters, value) => ({ ...filters, method: value }),
  dish: (filters, value) => ({ ...filters, dish: value }),
  goodFor: (filters, value) => ({ ...filters, goodFor: value }),
}

const targetParam = (target: MacroTarget | undefined): string | undefined =>
  target ? formatMacroTarget(target) : undefined

const numberParam = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : String(value)

// The filters as URL params. The sort is left out when it is the default, so a shared link
// does not pin a sort that would otherwise follow the search and goal.
export const toSearchParams = (filters: RecipeFilters): URLSearchParams => {
  const entries: [string, string | undefined][] = [
    ['q', filters.q],
    ['meat', filters.meat],
    ['method', filters.method],
    ['dish', filters.dish],
    ['goodFor', filters.goodFor],
    ['maxCalories', numberParam(filters.maxCalories)],
    ['maxMinutes', numberParam(filters.maxMinutes)],
    ['maxCost', numberParam(filters.maxCostTier)],
    ['maxDifficulty', numberParam(filters.maxDifficulty)],
    ['goal', filters.goal],
    // A goal supplies its own targets, so hand-set macros only travel without one
    ['carbs', filters.goal ? undefined : targetParam(filters.carbs)],
    ['fat', filters.goal ? undefined : targetParam(filters.fat)],
    ['protein', filters.goal ? undefined : targetParam(filters.protein)],
    ['sort', filters.sort === defaultSort(filters) ? undefined : filters.sort],
    ['reverse', filters.reverse && filters.sort !== 'match' ? '1' : undefined],
  ]

  return new URLSearchParams(
    entries.flatMap(([key, value]) => (value === undefined ? [] : [[key, value]]))
  )
}

export const searchParamsWithout = (
  filters: RecipeFilters,
  keys: string[]
): URLSearchParams => {
  const params = toSearchParams(filters)
  keys.forEach((key) => params.delete(key))
  return params
}

type FilterChip = {
  id: string
  label: string
  // URL params to drop to remove this chip
  params: string[]
}

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1)

const describeTarget = (name: string, target: MacroTarget): string => {
  if (target.kind === 'atMost') return `${name} ≤ ${target.value}%`
  if (target.kind === 'atLeast') return `${name} ≥ ${target.value}%`
  return `${name} ~${target.value}%`
}

// What is applied, in words, for the chips on a phone. A preset goal is one chip, and a
// custom mix lists each selector on its own.
export const describeFilters = (filters: RecipeFilters): FilterChip[] => {
  const goal = GOALS.find((item) => item.id === filters.goal)
  const chips: FilterChip[] = []
  const add = (id: string, label: string, params: string[]): void => {
    chips.push({ id, label, params })
  }

  if (goal) {
    add(goal.id, goal.label, ['goal'])
  } else {
    if (filters.carbs) {
      add('carbs', describeTarget('Carbs', filters.carbs), ['carbs'])
    }
    if (filters.fat) add('fat', describeTarget('Fat', filters.fat), ['fat'])
    if (filters.protein) {
      add('protein', describeTarget('Protein', filters.protein), ['protein'])
    }
  }

  if (filters.maxCalories !== undefined) {
    add('maxCalories', `Up to ${filters.maxCalories} cal`, ['maxCalories'])
  }
  if (filters.maxMinutes !== undefined) {
    add('maxMinutes', `Up to ${filters.maxMinutes} min`, ['maxMinutes'])
  }
  if (filters.maxCostTier !== undefined) {
    add('maxCost', `Cost up to ${'$'.repeat(filters.maxCostTier)}`, ['maxCost'])
  }
  if (filters.maxDifficulty !== undefined) {
    add('maxDifficulty', `Difficulty up to ${filters.maxDifficulty}`, [
      'maxDifficulty',
    ])
  }
  const tags: [TagFacet, string | undefined][] = [
    ['meat', filters.meat],
    ['method', filters.method],
    ['dish', filters.dish],
    ['goodFor', filters.goodFor],
  ]
  tags.forEach(([facet, name]) => {
    if (name) add(facet, capitalize(name), [facet])
  })

  return chips
}

// Options that would return nothing on top of the other current filters, so the bar can gray
// them out. The option already selected is never listed.
export const findUnavailableOptions = (
  recipes: RecipeCard[],
  filters: RecipeFilters,
  ingredientMatches: ReadonlySet<string>,
  tagGroups: TagGroups
): UnavailableOptions => {
  const current = toSearchParams(filters)
  const candidates: Record<FacetKey, string[]> = {
    ...FACET_VALUES,
    ...tagGroups,
  }
  const entries = (Object.keys(candidates) as FacetKey[]).map((key) => {
    const empty = candidates[key].filter(
      (value) =>
        value !== current.get(key) &&
        filterRecipes(recipes, APPLIERS[key](filters, value), ingredientMatches)
          .length === 0
    )
    return [key, empty] as const
  })

  return Object.fromEntries(entries.filter(([, values]) => values.length > 0))
}
