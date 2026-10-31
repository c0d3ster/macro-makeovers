import type { RecipeCard } from './recipeCards'
import type { Target } from './recipeGoals'
import type { MacroTarget } from './recipeMacros'

import {
  macroDistance,
  matchesMacroTarget,
  recipeMacroPercents,
} from './recipeMacros'

export type Fit = {
  isFit: boolean
  // Every way a recipe misses, short enough for a card. A calorie miss comes first, then the
  // macros from the furthest off to the closest.
  reasons: string[]
}

const MACROS = ['carbs', 'fat', 'protein'] as const

// How many points a share sits outside what the target accepts
const missBy = (target: MacroTarget, percent: number): number => {
  if (target.kind === 'atMost') return percent - target.value
  if (target.kind === 'atLeast') return target.value - percent
  return Math.abs(percent - target.value)
}

const isHigh = (target: MacroTarget, percent: number): boolean =>
  target.kind === 'atMost' ||
  (target.kind === 'near' && percent > target.value)

const misfitReasons = (
  recipe: RecipeCard,
  { goal, fit }: Target
): string[] => {
  const calorieReasons: string[] = []
  if (fit.maxCalories !== undefined && recipe.calories > fit.maxCalories) {
    calorieReasons.push(`Over ${fit.maxCalories} cal`)
  }
  if (fit.minCalories !== undefined && recipe.calories < fit.minCalories) {
    calorieReasons.push(`Under ${fit.minCalories} cal`)
  }

  const percents = recipeMacroPercents(recipe)
  const subject = goal ? 'this goal' : 'your targets'
  // Array.sort is stable, so equal misses keep the carbs, fat, protein order
  const macroReasons = MACROS.flatMap((name) => {
    const target = fit[name]
    if (!target || matchesMacroTarget(target, percents[name])) return []
    return [
      {
        gap: missBy(target, percents[name]),
        text: `${isHigh(target, percents[name]) ? 'High' : 'Low'} ${name} for ${subject}`,
      },
    ]
  })
    .sort((a, b) => b.gap - a.gap)
    .map(({ text }) => text)

  return [...calorieReasons, ...macroReasons]
}

export const evaluateFit = (recipe: RecipeCard, target: Target): Fit => {
  const reasons = misfitReasons(recipe, target)
  return { isFit: reasons.length === 0, reasons }
}

// How far a recipe's shares sit from the ranking targets, summed. Lower is closer.
export const distanceToTarget = (
  recipe: RecipeCard,
  { rank }: Target
): number => {
  const percents = recipeMacroPercents(recipe)

  return MACROS.reduce((sum, name) => {
    const target = rank[name]
    return target ? sum + macroDistance(target, percents[name]) : sum
  }, 0)
}
