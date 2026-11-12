import type { RecipeIngredient } from './ingredients'
import type {
  BuildScope,
  MacroValues,
  RecipeBuild,
  ResolvedBuild,
} from './recipeBuilds'
import type { RecipeCourse } from './recipeCourses'

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

// A side or sauce the recipe uses, shown inline in its ingredients. Its lines and steps are the
// ones its chosen build sees. The scope says which of the dish's builds use it.
export type RecipeComponent = BuildScope & {
  slug: string
  title: string
  // False while the component is a draft: it still shows inline, with no link to its page
  linked: boolean
  // "1/2 cup per bowl"
  amount?: string
  note?: string
  // Component servings per dish serving
  servingsPerServing: number
  // The servings the component's own recipe makes
  servings: number
  build: Pick<RecipeBuild, 'key' | 'label' | 'isDefault'> & MacroValues
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
}

export type RecipeDetail = {
  id: string
  slug: string
  title: string
  summary: string
  // The recipe's own photo (an R2 URL), if it has one
  imageUrl?: string
  servings: number
  // What one serving is ("1/2 cup") and what the batch makes ("2.5 cups"), when the recipe says
  servingSize?: string
  makes?: string
  prepMinutes: number
  cookMinutes: number
  totalMinutes: number
  costTier: number
  difficulty: number
  course: RecipeCourse
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
  // Sides and sauces this recipe uses, in order
  components: RecipeComponent[]
  // Set when this recipe is a variant of another
  baseRecipe?: RelatedRecipe
  variants: RelatedRecipe[]
  // Published dishes that use this recipe as a side or sauce
  usedIn: RelatedRecipe[]
}

// The page as one build reads it: the recipe's fields with the build's overrides applied, and
// only the lines, steps, and notes that build sees
export type RecipeView = ResolvedBuild & {
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  notes: RecipeNote[]
  components: RecipeComponent[]
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
    swap: Record<string, string>
    title: string | null
    noteMd: string | null
    costTier: number | null
    difficulty: number | null
    prepMinutes: number | null
    cookMinutes: number | null
    course: RecipeCourse | null
    imageUrl: string | null
  }

type IngredientRow = Positioned &
  ScopeColumns & {
    groupName: string | null
    rawText: string
  }

type StepRow = Positioned &
  ScopeColumns & {
    phase: StepPhase
    bodyMd: string
    durationMinutes: number | null
  }

// A component link as the database returns it, with the component's recipe attached
export type RecipeComponentRow = Positioned &
  ScopeColumns & {
    amount: string | null
    noteMd: string | null
    servingsPerServing: number
    componentBuild: string | null
    component: {
      slug: string
      title: string
      status: 'draft' | 'published'
      servings: number
      builds: RecipeBuildRow[]
      ingredients: IngredientRow[]
      steps: StepRow[]
    }
  }

// A published recipe as the database returns it, with every child attached
export type RecipeDetailRow = {
  id: string
  slug: string
  title: string
  summary: string
  servings: number
  servingSize?: string | null
  makes?: string | null
  prepMinutes: number
  cookMinutes: number
  costTier: number
  difficulty: number
  course: RecipeCourse
  imageUrl: string | null
  builds: RecipeBuildRow[]
  nutrition: (Positioned &
    MacroValues & {
      kind: 'makeover' | 'traditional'
      label: string
    })[]
  ingredients: IngredientRow[]
  steps: StepRow[]
  components?: RecipeComponentRow[]
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
  usedIn?: RelatedRecipe[]
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

const toRecipeBuild = (row: RecipeBuildRow): RecipeBuild => ({
  key: row.key,
  label: row.label,
  isDefault: row.isDefault,
  listed: row.listed,
  calories: row.calories,
  carbsG: row.carbsG,
  fatG: row.fatG,
  proteinG: row.proteinG,
  swap: row.swap,
  title: row.title ?? undefined,
  note: row.noteMd ?? undefined,
  costTier: row.costTier ?? undefined,
  difficulty: row.difficulty ?? undefined,
  prepMinutes: row.prepMinutes ?? undefined,
  cookMinutes: row.cookMinutes ?? undefined,
  ...(row.course ? { course: row.course } : {}),
  imageUrl: row.imageUrl ?? undefined,
})

export const toRecipeBuilds = (rows: RecipeBuildRow[]): RecipeBuild[] =>
  [...rows].sort(byPosition).map(toRecipeBuild)

const toIngredients = (rows: IngredientRow[]): RecipeIngredient[] =>
  [...rows].sort(byPosition).map((ingredient) => ({
    ...(ingredient.groupName ? { group: ingredient.groupName } : {}),
    raw: ingredient.rawText,
    ...toScope(ingredient),
  }))

const toSteps = (rows: StepRow[]): RecipeStep[] =>
  [...rows].sort(byPosition).map((step) => ({
    phase: step.phase,
    body: step.bodyMd,
    ...(step.durationMinutes !== null
      ? { durationMinutes: step.durationMinutes }
      : {}),
    ...toScope(step),
  }))

// Lines and steps the chosen build sees, with their scope dropped: on the dish's page it would
// read as the dish's own builds
const unscoped = <T extends BuildScope>({
  onlyBuilds: _only,
  skipBuilds: _skip,
  ...row
}: T): Omit<T, keyof BuildScope> => row

// A component with no build has nothing to show, so it is left out
const toRecipeComponent = (
  row: RecipeComponentRow
): RecipeComponent | undefined => {
  const { component } = row
  const build = findBuild(toRecipeBuilds(component.builds), row.componentBuild)
  if (!build) return undefined

  return {
    slug: component.slug,
    title: component.title,
    linked: component.status === 'published',
    ...(row.amount ? { amount: row.amount } : {}),
    ...(row.noteMd ? { note: row.noteMd } : {}),
    servingsPerServing: row.servingsPerServing,
    servings: component.servings,
    build: {
      key: build.key,
      label: build.label,
      isDefault: build.isDefault,
      calories: build.calories,
      carbsG: build.carbsG,
      fatG: build.fatG,
      proteinG: build.proteinG,
    },
    ingredients: scopeToBuild(toIngredients(component.ingredients), build.key).map(unscoped),
    steps: scopeToBuild(toSteps(component.steps), build.key).map(unscoped),
    ...toScope(row),
  }
}

const toRecipeComponents = (
  rows: RecipeComponentRow[]
): RecipeComponent[] =>
  [...rows].sort(byPosition).flatMap((row) => {
    const component = toRecipeComponent(row)
    return component ? [component] : []
  })

export const toRecipeDetail = (
  row: RecipeDetailRow,
  { baseRecipe, variants, usedIn = [] }: RelatedRecipes
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
    ...(row.servingSize ? { servingSize: row.servingSize } : {}),
    ...(row.makes ? { makes: row.makes } : {}),
    prepMinutes: row.prepMinutes,
    cookMinutes: row.cookMinutes,
    totalMinutes: row.prepMinutes + row.cookMinutes,
    costTier: row.costTier,
    difficulty: row.difficulty,
    course: row.course,
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
    ingredients: toIngredients(row.ingredients),
    steps: toSteps(row.steps),
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
    components: toRecipeComponents(row.components ?? []),
    baseRecipe,
    variants,
    usedIn,
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
    components: scopeToBuild(recipe.components, build.key),
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
