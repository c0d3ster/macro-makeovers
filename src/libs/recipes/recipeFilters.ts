import type { RecipeCard } from './recipeCards'
import type { MacroTarget } from './recipeMacros'

import { detectGoal } from './recipeGoals'
import {
  macroDistance,
  matchesMacroTarget,
  parseMacroTarget,
  recipeMacroPercents,
} from './recipeMacros'

const RECIPE_SORTS = [
  'match',
  'title',
  'calories',
  'time',
  'cost',
  'carbs',
  'fat',
  'protein',
] as const

// Tag groups with their own picker. Each holds one tag name per recipe filter.
export const TAG_FACETS = ['meat', 'method', 'dish', 'goodFor'] as const

export type RecipeSort = (typeof RECIPE_SORTS)[number]
export type TagFacet = (typeof TAG_FACETS)[number]

// Every field is optional: a missing field means "no limit"
export type RecipeFilters = {
  q?: string
  // Fixed by the URL path on a tag page
  tag?: string
  meat?: string
  method?: string
  dish?: string
  goodFor?: string
  maxCalories?: number
  maxMinutes?: number
  maxCostTier?: number
  maxDifficulty?: number
  carbs?: MacroTarget
  fat?: MacroTarget
  protein?: MacroTarget
  sort: RecipeSort
  // Flips the sort's natural direction. Best match has no direction to flip.
  reverse?: boolean
}

type FilterFields = Omit<RecipeFilters, 'sort' | 'reverse'>
type SearchParams = Record<string, string | string[] | undefined>

const COST_TIER_RANGE = { min: 1, max: 5 }
const DIFFICULTY_RANGE = { min: 1, max: 5 }

const firstValue = (value: string | string[] | undefined): string | undefined =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined

// Anything that is not a non-negative whole number is dropped instead of throwing,
// so a hand-edited link never breaks the page
const toLimit = (
  value: string | string[] | undefined,
  range: { min: number; max: number } = { min: 0, max: Number.MAX_SAFE_INTEGER }
): number | undefined => {
  const text = firstValue(value)
  if (!text || !/^\d+$/.test(text)) return undefined
  const parsed = Number(text)
  return parsed >= range.min && parsed <= range.max ? parsed : undefined
}

const toName = (value: string | string[] | undefined): string | undefined =>
  firstValue(value)?.toLowerCase()

// Best match only makes sense with something to match: search text, a goal, or macro targets
export const hasBestMatch = (filters: FilterFields): boolean =>
  Boolean(filters.q) || detectGoal(filters) !== undefined

export const defaultSort = (filters: FilterFields): RecipeSort =>
  hasBestMatch(filters) ? 'match' : 'title'

// A requested sort that cannot apply (like Best match with nothing to match) falls back
// to the default instead of erroring
const resolveSort = (
  filters: FilterFields,
  value: string | undefined
): RecipeSort => {
  const requested = RECIPE_SORTS.find((sort) => sort === value)
  if (!requested || (requested === 'match' && !hasBestMatch(filters))) {
    return defaultSort(filters)
  }
  return requested
}

export const parseRecipeFilters = (params: SearchParams): RecipeFilters => {
  const filters: FilterFields = {
    q: firstValue(params.q),
    tag: toName(params.tag),
    meat: toName(params.meat),
    method: toName(params.method),
    dish: toName(params.dish),
    goodFor: toName(params.goodFor),
    maxCalories: toLimit(params.maxCalories),
    maxMinutes: toLimit(params.maxMinutes),
    maxCostTier: toLimit(params.maxCost, COST_TIER_RANGE),
    maxDifficulty: toLimit(params.maxDifficulty, DIFFICULTY_RANGE),
    carbs: parseMacroTarget(firstValue(params.carbs)),
    fat: parseMacroTarget(firstValue(params.fat)),
    protein: parseMacroTarget(firstValue(params.protein)),
  }

  return {
    ...filters,
    sort: resolveSort(filters, firstValue(params.sort)),
    reverse: firstValue(params.reverse) === '1' ? true : undefined,
  }
}

// Filters that are set, not counting the sort. Drives the "clear" link and result copy.
export const countActiveFilters = ({
  sort: _sort,
  reverse: _reverse,
  ...filters
}: RecipeFilters): number =>
  Object.values(filters).filter((value) => value !== undefined).length

// What the filter bar's badge counts: its own controls, not the search text or a tag page's tag
export const countBarFilters = ({
  sort: _sort,
  reverse: _reverse,
  q: _q,
  tag: _tag,
  ...filters
}: RecipeFilters): number =>
  Object.values(filters).filter((value) => value !== undefined).length

const matchesText = (recipe: RecipeCard, q: string): boolean => {
  const haystack = [recipe.title, recipe.summary, ...recipe.tags]
    .join(' ')
    .toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word))
}

const hasTag = (recipe: RecipeCard, name: string | undefined): boolean =>
  !name || recipe.tags.some((tag) => tag.toLowerCase() === name)

const withinLimits = (
  recipe: RecipeCard,
  { maxCalories, maxMinutes, maxCostTier, maxDifficulty }: FilterFields
): boolean =>
  (maxCalories === undefined || recipe.calories <= maxCalories) &&
  (maxMinutes === undefined || recipe.totalMinutes <= maxMinutes) &&
  (maxCostTier === undefined || recipe.costTier <= maxCostTier) &&
  (maxDifficulty === undefined || recipe.difficulty <= maxDifficulty)

const matchesMacros = (
  recipe: RecipeCard,
  { carbs, fat, protein }: FilterFields
): boolean => {
  const percents = recipeMacroPercents(recipe)

  return (
    (!carbs || matchesMacroTarget(carbs, percents.carbs)) &&
    (!fat || matchesMacroTarget(fat, percents.fat)) &&
    (!protein || matchesMacroTarget(protein, percents.protein))
  )
}

const matchesFilters = (
  recipe: RecipeCard,
  filters: FilterFields,
  ingredientMatches: ReadonlySet<string>
): boolean => {
  const { q, tag, meat, method, dish, goodFor } = filters

  if (q && !matchesText(recipe, q) && !ingredientMatches.has(recipe.slug)) {
    return false
  }

  return (
    [tag, meat, method, dish, goodFor].every((name) => hasTag(recipe, name)) &&
    withinLimits(recipe, filters) &&
    matchesMacros(recipe, filters)
  )
}

const SORTERS: Record<
  Exclude<RecipeSort, 'match'>,
  (a: RecipeCard, b: RecipeCard) => number
> = {
  title: (a, b) => a.title.localeCompare(b.title),
  calories: (a, b) => a.calories - b.calories,
  time: (a, b) => a.totalMinutes - b.totalMinutes,
  cost: (a, b) => a.costTier - b.costTier,
  // Macro sorts use the same rounded shares as the cards. Fat runs lowest first, and carbs and
  // protein run highest first, which is what each is most often sorted for.
  carbs: (a, b) => recipeMacroPercents(b).carbs - recipeMacroPercents(a).carbs,
  fat: (a, b) => recipeMacroPercents(a).fat - recipeMacroPercents(b).fat,
  protein: (a, b) =>
    recipeMacroPercents(b).protein - recipeMacroPercents(a).protein,
}

// 3 for a title hit, 2 for tags, 1 for the summary, 0 for a recipe that only matched through
// its ingredients
const textTier = (recipe: RecipeCard, q: string | undefined): number => {
  if (!q) return 0

  const words = q.toLowerCase().split(/\s+/)
  const hits = (text: string): boolean =>
    words.every((word) => text.toLowerCase().includes(word))

  if (hits(recipe.title)) return 3
  if (hits(recipe.tags.join(' '))) return 2
  return hits(recipe.summary) ? 1 : 0
}

// How far a recipe's macro shares sit from the targets, summed. Lower is closer.
const distanceToTargets = (
  recipe: RecipeCard,
  { carbs, fat, protein }: FilterFields
): number => {
  const percents = recipeMacroPercents(recipe)

  return (
    (carbs ? macroDistance(carbs, percents.carbs) : 0) +
    (fat ? macroDistance(fat, percents.fat) : 0) +
    (protein ? macroDistance(protein, percents.protein) : 0)
  )
}

// Text relevance first, then closeness to the macro targets, then the goal's calorie lean
// (Recomp lighter first, Clean bulk heavier first), then A to Z.
const bestMatchComparator = (
  filters: RecipeFilters
): ((a: RecipeCard, b: RecipeCard) => number) => {
  const goal = detectGoal(filters)
  const lean = goal && goal !== 'custom' ? goal.calories : undefined

  const byCalories = (a: RecipeCard, b: RecipeCard): number => {
    if (lean === 'asc') return a.calories - b.calories
    if (lean === 'desc') return b.calories - a.calories
    return 0
  }

  return (a, b) =>
    textTier(b, filters.q) - textTier(a, filters.q) ||
    distanceToTargets(a, filters) - distanceToTargets(b, filters) ||
    byCalories(a, b) ||
    SORTERS.title(a, b)
}

const comparatorFor = (
  filters: RecipeFilters
): ((a: RecipeCard, b: RecipeCard) => number) => {
  const { sort } = filters
  if (sort === 'match') return bestMatchComparator(filters)

  // Ties fall back to A to Z so the order is stable between visits
  const direction = filters.reverse ? -1 : 1
  return (a, b) => direction * SORTERS[sort](a, b) || SORTERS.title(a, b)
}

// ingredientMatches holds slugs whose ingredients matched the search text, so "salmon" finds
// a recipe that only mentions it in the ingredient list
export const filterRecipes = (
  recipes: RecipeCard[],
  filters: RecipeFilters,
  ingredientMatches: ReadonlySet<string> = new Set()
): RecipeCard[] =>
  recipes
    .filter((recipe) => matchesFilters(recipe, filters, ingredientMatches))
    .sort(comparatorFor(filters))

// Every tag in use, A to Z
export const collectTags = (recipes: RecipeCard[]): string[] =>
  [...new Set(recipes.flatMap(({ tags }) => tags))].sort()
