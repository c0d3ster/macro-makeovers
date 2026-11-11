import type { RecipeIngredient } from './ingredients'
import type {
  BuildScope,
  MacroValues,
  RecipeBuild,
  ResolvedBuild,
} from './recipeBuilds'

import { defaultBuild, findBuild, resolveBuild, scopeToBuild } from './recipeBuilds'

export type StepPhase = 'prep' | 'cook'
export type NoteKind =
  | 'make_or_break'
  | 'fixes'
  | 'levers'
  | 'tip'
  | 'nutrition_intro'
  | 'nutrition_analysis'

// A traditional version, shown under the builds for comparison
export type ComparisonRow = MacroValues & {
  label: string
}

export type RecipeStep = BuildScope & {
  phase: StepPhase
  body: string
  durationMinutes?: number
}

export type RecipeNote = BuildScope & {
  kind: NoteKind
  body: string
}

// A paragraph around the nutrition table, which some builds may not show
export type ScopedText = BuildScope & {
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
  // Every build in table order
  builds: RecipeBuild[]
  // The build the page leads with
  featured: RecipeBuild
  // Traditional versions for comparison
  comparisons: ComparisonRow[]
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  // Paragraphs shown around the nutrition table: a line above it, analysis blocks below it
  nutritionIntro: ScopedText[]
  nutritionAnalysis: ScopedText[]
  notes: RecipeNote[]
  // Set when this recipe is a variant of another
  baseRecipe?: RelatedRecipe
  variants: RelatedRecipe[]
}

// The page as one build reads it: the recipe's fields with the build's overrides applied, and
// only the lines, steps, and notes that build sees
export type RecipeView = ResolvedBuild & {
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  notes: RecipeNote[]
  nutritionIntro: string[]
  nutritionAnalysis: string[]
}

type Positioned = { position: number }
type ScopeColumns = { onlyBuilds: string[]; skipBuilds: string[] }

// A recipe build as the database returns it
export type RecipeBuildRow = Positioned &
  MacroValues & {
    key: string
    label: string
    isDefault: boolean
    listed: boolean
    title: string | null
    summary: string | null
    noteMd: string | null
    costTier: number | null
    difficulty: number | null
    prepMinutes: number | null
    cookMinutes: number | null
    tagsAdd: string[]
    tagsRemove: string[]
    imageUrl: string | null
  }

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
  builds: RecipeBuildRow[]
  nutrition: (Positioned &
    MacroValues & {
      kind: 'makeover' | 'traditional'
      label: string
    })[]
  ingredients: (Positioned &
    ScopeColumns & {
      groupName: string | null
      rawText: string
    })[]
  steps: (Positioned &
    ScopeColumns & {
      phase: StepPhase
      bodyMd: string
      durationMinutes: number | null
    })[]
  notes: (Positioned &
    ScopeColumns & {
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

// Empty scope columns are left off, so an unscoped row looks the same as before builds
const toScope = ({ onlyBuilds, skipBuilds }: ScopeColumns): BuildScope => ({
  ...(onlyBuilds.length > 0 ? { onlyBuilds } : {}),
  ...(skipBuilds.length > 0 ? { skipBuilds } : {}),
})

export const toRecipeBuild = (row: RecipeBuildRow): RecipeBuild => ({
  key: row.key,
  label: row.label,
  isDefault: row.isDefault,
  listed: row.listed,
  calories: row.calories,
  carbsG: row.carbsG,
  fatG: row.fatG,
  proteinG: row.proteinG,
  title: row.title ?? undefined,
  summary: row.summary ?? undefined,
  note: row.noteMd ?? undefined,
  costTier: row.costTier ?? undefined,
  difficulty: row.difficulty ?? undefined,
  prepMinutes: row.prepMinutes ?? undefined,
  cookMinutes: row.cookMinutes ?? undefined,
  tagsAdd: row.tagsAdd,
  tagsRemove: row.tagsRemove,
  imageUrl: row.imageUrl ?? undefined,
})

export const toRecipeBuilds = (rows: RecipeBuildRow[]): RecipeBuild[] =>
  [...rows].sort(byPosition).map(toRecipeBuild)

export const toRecipeDetail = (
  row: RecipeDetailRow,
  { baseRecipe, variants }: RelatedRecipes
): RecipeDetail | undefined => {
  const builds = toRecipeBuilds(row.builds)
  const featured = defaultBuild(builds)
  if (!featured) return undefined

  const nutritionNotes = (kind: NoteKind): ScopedText[] =>
    row.notes
      .filter((note) => note.kind === kind)
      .sort(byPosition)
      .map((note) => ({ body: note.bodyMd, ...toScope(note) }))

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
    builds,
    featured,
    comparisons: [...row.nutrition]
      .filter(({ kind }) => kind === 'traditional')
      .sort(byPosition)
      .map(({ label, calories, carbsG, fatG, proteinG }) => ({
        label,
        calories,
        carbsG,
        fatG,
        proteinG,
      })),
    ingredients: [...row.ingredients].sort(byPosition).map((ingredient) => ({
      ...(ingredient.groupName ? { group: ingredient.groupName } : {}),
      raw: ingredient.rawText,
      ...toScope(ingredient),
    })),
    steps: [...row.steps].sort(byPosition).map((step) => ({
      phase: step.phase,
      body: step.bodyMd,
      ...(step.durationMinutes !== null
        ? { durationMinutes: step.durationMinutes }
        : {}),
      ...toScope(step),
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
      .map((note) => ({ kind: note.kind, body: note.bodyMd, ...toScope(note) })),
    baseRecipe,
    variants,
  }
}

// The recipe as one build reads it. An unknown or missing key reads as the default build.
export const toRecipeView = (
  recipe: RecipeDetail,
  key?: string | null
): RecipeView => {
  const build = findBuild(recipe.builds, key) ?? recipe.featured
  const bodies = (rows: ScopedText[]): string[] =>
    scopeToBuild(rows, build.key).map(({ body }) => body)

  return {
    ...resolveBuild(recipe, build),
    ingredients: scopeToBuild(recipe.ingredients, build.key),
    steps: scopeToBuild(recipe.steps, build.key),
    notes: scopeToBuild(recipe.notes, build.key),
    nutritionIntro: bodies(recipe.nutritionIntro),
    nutritionAnalysis: bodies(recipe.nutritionAnalysis),
  }
}

// The summary's first sentence, capped for a search or share preview
export const toMetaDescription = (summary: string): string => {
  const sentence = summary.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? summary
  if (sentence.length <= META_DESCRIPTION_LIMIT) return sentence

  return `${sentence.slice(0, META_DESCRIPTION_LIMIT - 3).trimEnd()}...`
}
