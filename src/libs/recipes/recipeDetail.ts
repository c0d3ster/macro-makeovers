import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/libs/supabase/database.types'

import type { RecipeIngredient } from './ingredients'

import { placeholderPhotoFor } from './recipeImages'

type Enums = Database['public']['Enums']

export type NutritionBuild = {
  kind: Enums['nutrition_kind']
  label: string
  isDefault: boolean
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export type RecipeStep = {
  phase: Enums['step_phase']
  body: string
  durationMinutes?: number
}

export type RecipeNote = {
  kind: Enums['note_kind']
  body: string
}

export type RelatedRecipe = {
  slug: string
  title: string
}

export type RecipeDetail = {
  slug: string
  title: string
  summary: string
  // The recipe's own photo, else a stand-in from public/images, else none
  imageUrl?: string
  servings: number
  prepMinutes: number
  cookMinutes: number
  totalMinutes: number
  costTier: number
  difficulty: number
  tags: string[]
  // Every build in the book's order, makeover and traditional alike
  nutrition: NutritionBuild[]
  // The makeover the page leads with
  featured: NutritionBuild
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  // Paragraphs shown around the nutrition table: a line above it, analysis blocks below it
  nutritionIntro: string[]
  nutritionAnalysis: string[]
  notes: RecipeNote[]
  // Set when this recipe is a variant of another
  baseRecipe?: RelatedRecipe
  variants: RelatedRecipe[]
}

type Positioned = { position: number }

export type RecipeDetailRow = {
  id: string
  slug: string
  title: string
  summary: string
  servings: number
  prep_minutes: number
  cook_minutes: number
  cost_tier: number
  difficulty: number
  variant_of: string | null
  image_url: string | null
  recipe_nutrition: (Positioned & {
    kind: Enums['nutrition_kind']
    label: string
    is_default: boolean
    calories: number
    carbs_g: number
    fat_g: number
    protein_g: number
  })[]
  ingredients: (Positioned & {
    group_name: string | null
    raw_text: string
  })[]
  steps: (Positioned & {
    phase: Enums['step_phase']
    body_md: string
    duration_minutes: number | null
  })[]
  recipe_notes: (Positioned & {
    kind: Enums['note_kind']
    body_md: string
  })[]
  recipe_tags: { tags: { name: string } | null }[]
}

type RelatedRecipes = {
  baseRecipe?: RelatedRecipe
  variants: RelatedRecipe[]
}

const DETAIL_COLUMNS = `
  id, slug, title, summary, servings, prep_minutes, cook_minutes, cost_tier, difficulty, variant_of, image_url,
  recipe_nutrition (kind, label, is_default, position, calories, carbs_g, fat_g, protein_g),
  ingredients (group_name, position, raw_text),
  steps (phase, position, body_md, duration_minutes),
  recipe_notes (kind, position, body_md),
  recipe_tags (tags (name))
`

// The order the sections read in on the page
const NOTE_ORDER: readonly Enums['note_kind'][] = [
  'make_or_break',
  'tip',
  'fixes',
  'levers',
]

const NUTRITION_KINDS: readonly Enums['note_kind'][] = [
  'nutrition_intro',
  'nutrition_analysis',
]

const META_DESCRIPTION_LIMIT = 160

const byPosition = (a: Positioned, b: Positioned): number =>
  a.position - b.position

// The default makeover, else the first makeover, else nothing. Same rule the grid card uses,
// so a recipe leads with the same numbers on both pages.
export const featuredBuild = (
  builds: NutritionBuild[]
): NutritionBuild | undefined => {
  const makeovers = builds.filter(({ kind }) => kind === 'makeover')
  return makeovers.find(({ isDefault }) => isDefault) ?? makeovers[0]
}

export const toRecipeDetail = (
  row: RecipeDetailRow,
  { baseRecipe, variants }: RelatedRecipes
): RecipeDetail | undefined => {
  const nutrition = [...row.recipe_nutrition]
    .sort(byPosition)
    .map(
      ({ kind, label, is_default, calories, protein_g, carbs_g, fat_g }) => ({
        kind,
        label,
        isDefault: is_default,
        calories,
        proteinG: protein_g,
        carbsG: carbs_g,
        fatG: fat_g,
      })
    )
  const featured = featuredBuild(nutrition)
  if (!featured) return undefined

  const nutritionNotes = (kind: Enums['note_kind']): string[] =>
    row.recipe_notes
      .filter((note) => note.kind === kind)
      .sort(byPosition)
      .map(({ body_md }) => body_md)

  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    imageUrl: row.image_url ?? placeholderPhotoFor(row.slug),
    servings: row.servings,
    prepMinutes: row.prep_minutes,
    cookMinutes: row.cook_minutes,
    totalMinutes: row.prep_minutes + row.cook_minutes,
    costTier: row.cost_tier,
    difficulty: row.difficulty,
    tags: row.recipe_tags
      .flatMap(({ tags }) => (tags ? [tags.name] : []))
      .sort(),
    nutrition,
    featured,
    ingredients: [...row.ingredients]
      .sort(byPosition)
      .map(({ group_name, raw_text }) => ({
        group: group_name ?? undefined,
        raw: raw_text,
      })),
    steps: [...row.steps]
      .sort(byPosition)
      .map(({ phase, body_md, duration_minutes }) => ({
        phase,
        body: body_md,
        durationMinutes: duration_minutes ?? undefined,
      })),
    nutritionIntro: nutritionNotes('nutrition_intro'),
    nutritionAnalysis: nutritionNotes('nutrition_analysis'),
    notes: [...row.recipe_notes]
      .filter(({ kind }) => !NUTRITION_KINDS.includes(kind))
      .sort(
        (a, b) =>
          NOTE_ORDER.indexOf(a.kind) - NOTE_ORDER.indexOf(b.kind) ||
          byPosition(a, b)
      )
      .map(({ kind, body_md }) => ({ kind, body: body_md })),
    baseRecipe,
    variants,
  }
}

// The summary's first sentence, capped for a search or share preview
export const toMetaDescription = (summary: string): string => {
  const sentence = summary.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? summary
  if (sentence.length <= META_DESCRIPTION_LIMIT) return sentence

  return `${sentence.slice(0, META_DESCRIPTION_LIMIT - 3).trimEnd()}...`
}

const loadRelated = async (
  client: SupabaseClient<Database>,
  { id, variantOf }: { id: string; variantOf: string | null }
): Promise<RelatedRecipes> => {
  const [variants, base] = await Promise.all([
    client
      .from('recipes')
      .select('slug, title')
      .eq('variant_of', id)
      .eq('status', 'published')
      .order('title'),
    variantOf
      ? client
          .from('recipes')
          .select('slug, title')
          .eq('id', variantOf)
          .eq('status', 'published')
          .maybeSingle()
      : undefined,
  ])
  if (variants.error) {
    throw new Error(`Could not load variants: ${variants.error.message}`)
  }
  if (base?.error) {
    throw new Error(`Could not load the base recipe: ${base.error.message}`)
  }

  return { baseRecipe: base?.data ?? undefined, variants: variants.data }
}

// One published recipe with everything the page needs, or undefined when the slug is unknown
// or unpublished (row-level security hides drafts from this client either way).
export const getRecipeDetail = async (
  client: SupabaseClient<Database>,
  slug: string
): Promise<RecipeDetail | undefined> => {
  const { data, error } = await client
    .from('recipes')
    .select(DETAIL_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw new Error(`Could not load "${slug}": ${error.message}`)
  if (!data) return undefined

  const related = await loadRelated(client, {
    id: data.id,
    variantOf: data.variant_of,
  })
  return toRecipeDetail(data, related)
}

// Every published slug, variants included, so each recipe page can be built ahead of time
export const listRecipeSlugs = async (
  client: SupabaseClient<Database>
): Promise<string[]> => {
  const { data, error } = await client
    .from('recipes')
    .select('slug')
    .eq('status', 'published')
  if (error) throw new Error(`Could not list recipes: ${error.message}`)

  return data.map(({ slug }) => slug)
}
