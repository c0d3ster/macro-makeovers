import type { MacroTarget } from './recipeMacros'

export type GoalId =
  | 'balanced'
  | 'fat-loss'
  | 'body-recomp'
  | 'clean-bulk'
  | 'full-bulk'
  | 'carb-cycling-low'
  | 'carb-cycling-high'

export type MacroTargets = {
  carbs?: MacroTarget
  fat?: MacroTarget
  protein?: MacroTarget
}

// What makes a recipe a good fit. Calories count as part of the rule, so a recipe over a
// ceiling or under a floor is not a match even when its ratio is.
type FitRule = MacroTargets & {
  minCalories?: number
  maxCalories?: number
}

export type Goal = {
  id: GoalId
  // Shown in the Goal dropdown and on the active-filter chip
  label: string
  note: string
  fit: FitRule
  // Macro targets that rank recipes by closeness. Falls back to the macros in `fit`.
  rank?: MacroTargets
  // Which way Best match leans on calories once the ratio is as close as it gets
  calories?: 'asc' | 'desc'
}

const near = (value: number): MacroTarget => ({ kind: 'near', value })

// Percentages are shares of calories, rounded the way the recipe cards show them. Recomp and
// Clean Bulk come from the book (docs/nutrition-guide.md). The rest are working defaults, all
// here so tuning one is a one-line edit.
//
// Clean Bulk is a 50 / 25 / 25 split over a whole day, but every recipe is between 34% and 48%
// carbs, so a dish can never hit 50. The rule scores fat and protein and accepts any carbs at
// 40 or above, since the side or drink that goes with it adds the rest.
export const GOALS: Goal[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    note: 'Steady weight. Meals near 40 / 30 / 30.',
    fit: { carbs: near(40), fat: near(30), protein: near(30) },
  },
  {
    id: 'fat-loss',
    label: 'Fat Loss',
    note: 'Calorie deficit. Meals up to 550 cal, near 40 / 25 / 35.',
    fit: {
      carbs: near(40),
      fat: near(25),
      protein: near(35),
      maxCalories: 550,
    },
  },
  {
    id: 'body-recomp',
    label: 'Body Recomp',
    note: 'At or slightly below maintenance. Meals near 45 / 25 / 30.',
    fit: { carbs: near(45), fat: near(25), protein: near(30) },
    calories: 'asc',
  },
  {
    id: 'clean-bulk',
    label: 'Clean Bulk',
    note: 'Small surplus. Add a carb side or a drink to reach 50 / 25 / 25.',
    fit: {
      carbs: { kind: 'atLeast', value: 40 },
      fat: near(25),
      protein: near(30),
    },
    rank: { fat: near(25), protein: near(30) },
    calories: 'desc',
  },
  {
    id: 'full-bulk',
    label: 'Full Bulk',
    note: 'Bigger surplus, more fat. Meals of 600 cal or more.',
    fit: { minCalories: 600 },
    rank: { carbs: near(45), fat: near(30), protein: near(25) },
    calories: 'desc',
  },
  {
    id: 'carb-cycling-low',
    label: 'Carb Cycling Low',
    note: 'Lower-carb day. Fewest carbs first.',
    fit: { carbs: { kind: 'atMost', value: 35 } },
  },
  {
    id: 'carb-cycling-high',
    label: 'Carb Cycling High',
    note: 'Higher-carb day. Most carbs first.',
    fit: { carbs: { kind: 'atLeast', value: 45 } },
  },
]

// What recipes are ranked and tagged against: a goal, or the macro dropdowns set by hand
export type Target = {
  goal?: Goal
  fit: FitRule
  rank: MacroTargets
  calories?: 'asc' | 'desc'
}

type TargetInputs = MacroTargets & { goal?: string }

const macrosOf = ({ carbs, fat, protein }: MacroTargets): MacroTargets => ({
  carbs,
  fat,
  protein,
})

// A goal wins over hand-set macros. With neither there is no target, so nothing is ranked.
export const resolveTarget = ({
  goal: goalId,
  carbs,
  fat,
  protein,
}: TargetInputs): Target | undefined => {
  const goal = GOALS.find((item) => item.id === goalId)
  if (goal) {
    return {
      goal,
      fit: goal.fit,
      rank: goal.rank ?? macrosOf(goal.fit),
      calories: goal.calories,
    }
  }

  if (!carbs && !fat && !protein) return undefined

  const macros = macrosOf({ carbs, fat, protein })
  return { fit: macros, rank: macros }
}
