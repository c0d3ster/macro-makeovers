type PlanFeature = {
  title: string
  detail: string
  // False until the feature ships. Shown as "Coming soon" so nobody pays for what is not there.
  available: boolean
}

// Exactly what the paid plan adds (PRD 01). Flip `available` as PRD 03 phase 3 and PRD 02 phase 4 ship.
export const PAID_FEATURES: PlanFeature[] = [
  {
    title: 'Meal planner',
    detail:
      'Plan a week of meals that hits your protein, carb, and fat targets, with suggestions that use up your leftovers.',
    available: false,
  },
  {
    title: 'Send to cart',
    detail:
      'Send your basket straight to a grocery store cart instead of copying the list.',
    available: false,
  },
  {
    title: 'The recipe book',
    detail:
      'Download every recipe as a printable PDF, rebuilt whenever a recipe is added or changed.',
    available: true,
  },
]

// What stays free, said plainly so nobody subscribes for something they already have
export const FREE_FEATURES: string[] = [
  'Every recipe, with filters and the servings scaler',
  'The basket: a pooled shopping list with costs and bundle savings',
  'Saving your basket to your account',
  'Favorites and reviews',
]
