import type { RecipeCard } from './recipeCards'
import type { Target } from './recipeGoals'

import {
  macroDistance,
  matchesMacroTarget,
  recipeMacroPercents,
} from './recipeMacros'

export type Fit = {
  isFit: boolean
  // Why a recipe is not a good fit, short enough for a card
  reason?: string
}

const MACROS = ['carbs', 'fat', 'protein'] as const

const misfitReason = (
  recipe: RecipeCard,
  { goal, fit }: Target
): string | undefined => {
  if (fit.maxCalories !== undefined && recipe.calories > fit.maxCalories) {
    return `Over ${fit.maxCalories} cal`
  }
  if (fit.minCalories !== undefined && recipe.calories < fit.minCalories) {
    return `Under ${fit.minCalories} cal`
  }

  const percents = recipeMacroPercents(recipe)
  const missed = MACROS.find((name) => {
    const target = fit[name]
    return target && !matchesMacroTarget(target, percents[name])
  })
  const target = missed && fit[missed]
  if (!missed || !target) return undefined

  const isHigh =
    target.kind === 'atMost' ||
    (target.kind === 'near' && percents[missed] > target.value)
  return `${isHigh ? 'High' : 'Low'} ${missed} for ${goal ? 'this goal' : 'your targets'}`
}

export const evaluateFit = (recipe: RecipeCard, target: Target): Fit => {
  const reason = misfitReason(recipe, target)
  return reason === undefined ? { isFit: true } : { isFit: false, reason }
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
