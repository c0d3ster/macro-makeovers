import type { RecipeCard } from './recipeCards'

import { toMacroRatios } from './macroRatios'

type MacroName = 'carbs' | 'fat' | 'protein'

// "near" is a target with a window on either side. "atMost" and "atLeast" are open-ended and
// only used where a ceiling or a floor is the point, like carb cycling.
export type MacroTarget =
  | { kind: 'near'; value: number }
  | { kind: 'atMost'; value: number }
  | { kind: 'atLeast'; value: number }

// How many percentage points either side of a "near" target still count as a match
const MACRO_SPREAD = 4

// URL form: "35" is near 35, "le35" is 35 or less, "ge45" is 45 or more
const TARGET_PATTERN = /^(le|ge)?(\d{1,2})$/

export const parseMacroTarget = (
  value: string | undefined
): MacroTarget | undefined => {
  const match = value ? TARGET_PATTERN.exec(value) : null
  if (!match) return undefined

  const number = Number(match[2])
  if (match[1] === 'le') return { kind: 'atMost', value: number }
  if (match[1] === 'ge') return { kind: 'atLeast', value: number }
  return { kind: 'near', value: number }
}

export const formatMacroTarget = ({ kind, value }: MacroTarget): string => {
  if (kind === 'atMost') return `le${value}`
  if (kind === 'atLeast') return `ge${value}`
  return String(value)
}

export const matchesMacroTarget = (
  target: MacroTarget,
  percent: number
): boolean => {
  if (target.kind === 'atMost') return percent <= target.value
  if (target.kind === 'atLeast') return percent >= target.value
  return Math.abs(percent - target.value) <= MACRO_SPREAD
}

// Lower is a closer match. Open-ended targets prefer the extreme, so "35% or less" puts
// the lowest-carb recipes first.
export const macroDistance = (target: MacroTarget, percent: number): number => {
  if (target.kind === 'atMost') return percent
  if (target.kind === 'atLeast') return -percent
  return Math.abs(percent - target.value)
}

// The same rounded shares the recipe card shows, from the featured makeover row
export const recipeMacroPercents = (
  recipe: RecipeCard
): Record<MacroName, number> => {
  const { carbsPct, fatPct, proteinPct } = toMacroRatios(recipe)
  return { carbs: carbsPct, fat: fatPct, protein: proteinPct }
}
