// What the grid needs to draw one recipe: headline facts plus the featured build's macros
export type RecipeCard = {
  slug: string
  title: string
  summary: string
  // The recipe's own photo (an R2 URL), if it has one
  imageUrl?: string
  servings: number
  totalMinutes: number
  costTier: number
  difficulty: number
  tags: string[]
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  // The traditional version's macros, when the recipe has one
  original?: { proteinG: number; carbsG: number; fatG: number }
}

type NutritionRow = {
  kind: 'makeover' | 'traditional'
  isDefault: boolean
  calories: number
  carbsG: number
  fatG: number
  proteinG: number
}

// A recipe as the database returns it for the grid, with its builds and tags attached
export type RecipeCardRow = {
  slug: string
  title: string
  summary: string
  servings: number
  prepMinutes: number
  cookMinutes: number
  costTier: number
  difficulty: number
  imageUrl: string | null
  nutrition: NutritionRow[]
  recipeTags: { tag: { name: string } }[]
}

// The featured build is the default makeover row. Fall back to the first makeover row so a
// recipe never loses its card over a missing flag. A recipe with no makeover row has no card.
const featuredNutrition = (rows: NutritionRow[]): NutritionRow | undefined => {
  const makeovers = rows.filter(({ kind }) => kind === 'makeover')
  return makeovers.find(({ isDefault }) => isDefault) ?? makeovers[0]
}

// A card shows the summary's first sentence so it ends on a full stop instead of an ellipsis
export const toCardSummary = (summary: string): string =>
  summary.match(/.*?[.!?](?=\s|$)/)?.[0].trim() ?? summary

export const toRecipeCard = (row: RecipeCardRow): RecipeCard | undefined => {
  const nutrition = featuredNutrition(row.nutrition)
  if (!nutrition) return undefined
  const traditional = row.nutrition.find(({ kind }) => kind === 'traditional')

  return {
    slug: row.slug,
    title: row.title,
    summary: toCardSummary(row.summary),
    imageUrl: row.imageUrl ?? undefined,
    servings: row.servings,
    totalMinutes: row.prepMinutes + row.cookMinutes,
    costTier: row.costTier,
    difficulty: row.difficulty,
    tags: row.recipeTags.map(({ tag }) => tag.name).sort(),
    calories: nutrition.calories,
    proteinG: nutrition.proteinG,
    carbsG: nutrition.carbsG,
    fatG: nutrition.fatG,
    original: traditional && {
      proteinG: traditional.proteinG,
      carbsG: traditional.carbsG,
      fatG: traditional.fatG,
    },
  }
}
