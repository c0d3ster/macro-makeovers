import type { RecipeIngredient } from './ingredients'

export type NutritionKind = 'makeover' | 'traditional'
export type StepPhase = 'prep' | 'cook'
export type NoteKind =
  | 'make_or_break'
  | 'fixes'
  | 'levers'
  | 'tip'
  | 'nutrition_intro'
  | 'nutrition_analysis'

export type NutritionBuild = {
  kind: NutritionKind
  label: string
  isDefault: boolean
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export type RecipeStep = {
  phase: StepPhase
  body: string
  durationMinutes?: number
}

export type RecipeNote = {
  kind: NoteKind
  body: string
}

export type RelatedRecipe = {
  slug: string
  title: string
}

export type RecipeDetail = {
  id: string
  slug: string
  title: string
  summary: string
  // The recipe's own photo (an R2 URL), if it has one
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

// A published recipe as the database returns it, with every child attached
export type RecipeDetailRow = {
  id: string
  slug: string
  title: string
  summary: string
  servings: number
  prepMinutes: number
  cookMinutes: number
  costTier: number
  difficulty: number
  imageUrl: string | null
  nutrition: (Positioned & {
    kind: NutritionKind
    label: string
    isDefault: boolean
    calories: number
    carbsG: number
    fatG: number
    proteinG: number
  })[]
  ingredients: (Positioned & {
    groupName: string | null
    rawText: string
  })[]
  steps: (Positioned & {
    phase: StepPhase
    bodyMd: string
    durationMinutes: number | null
  })[]
  notes: (Positioned & {
    kind: NoteKind
    bodyMd: string
  })[]
  recipeTags: { tag: { name: string } }[]
}

type RelatedRecipes = {
  baseRecipe?: RelatedRecipe
  variants: RelatedRecipe[]
}

// The order the sections read in on the page
const NOTE_ORDER: readonly NoteKind[] = [
  'make_or_break',
  'tip',
  'fixes',
  'levers',
]

const NUTRITION_NOTE_KINDS: readonly NoteKind[] = [
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
  const nutrition = [...row.nutrition]
    .sort(byPosition)
    .map(({ kind, label, isDefault, calories, proteinG, carbsG, fatG }) => ({
      kind,
      label,
      isDefault,
      calories,
      proteinG,
      carbsG,
      fatG,
    }))
  const featured = featuredBuild(nutrition)
  if (!featured) return undefined

  const nutritionNotes = (kind: NoteKind): string[] =>
    row.notes
      .filter((note) => note.kind === kind)
      .sort(byPosition)
      .map(({ bodyMd }) => bodyMd)

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    imageUrl: row.imageUrl ?? undefined,
    servings: row.servings,
    prepMinutes: row.prepMinutes,
    cookMinutes: row.cookMinutes,
    totalMinutes: row.prepMinutes + row.cookMinutes,
    costTier: row.costTier,
    difficulty: row.difficulty,
    tags: row.recipeTags.map(({ tag }) => tag.name).sort(),
    nutrition,
    featured,
    ingredients: [...row.ingredients]
      .sort(byPosition)
      .map(({ groupName, rawText }) => ({
        group: groupName ?? undefined,
        raw: rawText,
      })),
    steps: [...row.steps]
      .sort(byPosition)
      .map(({ phase, bodyMd, durationMinutes }) => ({
        phase,
        body: bodyMd,
        durationMinutes: durationMinutes ?? undefined,
      })),
    nutritionIntro: nutritionNotes('nutrition_intro'),
    nutritionAnalysis: nutritionNotes('nutrition_analysis'),
    notes: [...row.notes]
      .filter(({ kind }) => !NUTRITION_NOTE_KINDS.includes(kind))
      .sort(
        (a, b) =>
          NOTE_ORDER.indexOf(a.kind) - NOTE_ORDER.indexOf(b.kind) ||
          byPosition(a, b)
      )
      .map(({ kind, bodyMd }) => ({ kind, body: bodyMd })),
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
