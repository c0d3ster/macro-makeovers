import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/libs/supabase/database.types'

import { placeholderPhotoFor } from './recipeImages'

// What the grid needs to draw one recipe: headline facts plus the featured build's macros
export type RecipeCard = {
  slug: string
  title: string
  summary: string
  // The recipe's own photo, else a stand-in from public/images, else none
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
}

type NutritionRow = {
  kind: Database['public']['Enums']['nutrition_kind']
  is_default: boolean
  calories: number
  carbs_g: number
  fat_g: number
  protein_g: number
}

export type RecipeCardRow = {
  slug: string
  title: string
  summary: string
  servings: number
  prep_minutes: number
  cook_minutes: number
  cost_tier: number
  difficulty: number
  image_url: string | null
  recipe_nutrition: NutritionRow[]
  recipe_tags: { tags: { name: string } | null }[]
}

const CARD_COLUMNS = `
  slug, title, summary, servings, prep_minutes, cook_minutes, cost_tier, difficulty, image_url,
  recipe_nutrition (kind, is_default, calories, carbs_g, fat_g, protein_g),
  recipe_tags (tags (name))
`

// The featured build is the default makeover row. Fall back to the first makeover row so a
// recipe never loses its card over a missing flag. A recipe with no makeover row has no card.
const featuredNutrition = (rows: NutritionRow[]): NutritionRow | undefined => {
  const makeovers = rows.filter(({ kind }) => kind === 'makeover')
  return makeovers.find(({ is_default }) => is_default) ?? makeovers[0]
}

// A card shows the summary's first sentence so it ends on a full stop instead of an ellipsis
export const toCardSummary = (summary: string): string =>
  summary.match(/.*?[.!?](?=\s|$)/)?.[0].trim() ?? summary

export const toRecipeCard = (row: RecipeCardRow): RecipeCard | undefined => {
  const nutrition = featuredNutrition(row.recipe_nutrition)
  if (!nutrition) return undefined

  return {
    slug: row.slug,
    title: row.title,
    summary: toCardSummary(row.summary),
    imageUrl: row.image_url ?? placeholderPhotoFor(row.slug),
    servings: row.servings,
    totalMinutes: row.prep_minutes + row.cook_minutes,
    costTier: row.cost_tier,
    difficulty: row.difficulty,
    tags: row.recipe_tags
      .flatMap(({ tags }) => (tags ? [tags.name] : []))
      .sort(),
    calories: nutrition.calories,
    proteinG: nutrition.protein_g,
    carbsG: nutrition.carbs_g,
    fatG: nutrition.fat_g,
  }
}

// Published base recipes for the grid, A to Z. Variants are reached from their base recipe.
export const listRecipeCards = async (
  client: SupabaseClient<Database>
): Promise<RecipeCard[]> => {
  const { data, error } = await client
    .from('recipes')
    .select(CARD_COLUMNS)
    .eq('status', 'published')
    .is('variant_of', null)
    .order('title')
  if (error) throw new Error(`Could not load recipes: ${error.message}`)

  return data.flatMap((row) => {
    const card = toRecipeCard(row)
    return card ? [card] : []
  })
}
