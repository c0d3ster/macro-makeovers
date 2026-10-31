import type { MacroTarget } from './recipeMacros'

import { formatMacroTarget } from './recipeMacros'

type GoalId =
  | 'fat-loss'
  | 'body-recomp'
  | 'clean-bulk'
  | 'carb-cycling-low'
  | 'carb-cycling-high'

// The filters a goal fills in. A goal is only a preset of these, so what it selected is
// always visible and editable in the filter bar.
export type GoalFields = {
  carbs?: MacroTarget
  fat?: MacroTarget
  protein?: MacroTarget
  maxCalories?: number
}

export type Goal = GoalFields & {
  id: GoalId
  // Shown in the Goal dropdown and on the active-filter chip
  label: string
  note: string
  // Which way Best match leans on calories once the ratio is as close as it gets
  calories?: 'asc' | 'desc'
}

const near = (value: number): MacroTarget => ({ kind: 'near', value })

// Body Recomp and Clean Bulk are the book's own ratios (docs/nutrition-guide.md). The rest are
// working defaults, kept here in one place so tuning them is a one-line edit.
export const GOALS: Goal[] = [
  {
    id: 'fat-loss',
    label: 'Fat Loss',
    note: 'Calorie deficit. Meals up to 550 cal, near 40 / 25 / 35.',
    carbs: near(40),
    fat: near(25),
    protein: near(35),
    maxCalories: 550,
  },
  {
    id: 'body-recomp',
    label: 'Body Recomp',
    note: 'At or near maintenance calories. Meals near 45 / 25 / 30.',
    carbs: near(45),
    fat: near(25),
    protein: near(30),
    calories: 'asc',
  },
  {
    id: 'clean-bulk',
    label: 'Clean Bulk',
    note: 'Small calorie surplus. Meals near 40 / 30 / 30.',
    carbs: near(40),
    fat: near(30),
    protein: near(30),
    calories: 'desc',
  },
  {
    id: 'carb-cycling-low',
    label: 'Carb Cycling Low',
    note: 'Lower-carb day, often with fewer total calories. Fewest carbs first.',
    carbs: { kind: 'atMost', value: 35 },
  },
  {
    id: 'carb-cycling-high',
    label: 'Carb Cycling High',
    note: 'Higher-carb day, often with more total calories. Most carbs first.',
    carbs: { kind: 'atLeast', value: 45 },
  },
]

const targetKey = (target: MacroTarget | undefined): string | undefined =>
  target ? formatMacroTarget(target) : undefined

// Which goal the current filters add up to. The label is worked out from the filters every
// time, so editing a selector after picking a goal can never leave a stale label: it
// reads "custom" instead.
export const detectGoal = ({
  carbs,
  fat,
  protein,
  maxCalories,
}: GoalFields): Goal | 'custom' | undefined => {
  if (!carbs && !fat && !protein && maxCalories === undefined) return undefined

  return (
    GOALS.find(
      (goal) =>
        targetKey(goal.carbs) === targetKey(carbs) &&
        targetKey(goal.fat) === targetKey(fat) &&
        targetKey(goal.protein) === targetKey(protein) &&
        goal.maxCalories === maxCalories
    ) ?? 'custom'
  )
}
