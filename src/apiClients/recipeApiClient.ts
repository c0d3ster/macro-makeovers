import gql from 'graphql-tag'

import type {
  AdminRecipesQuery,
  EditableRecipeQuery,
  ImportRecipeMutation,
  RecipeCardsQuery,
  RecipeQuery,
} from '@/graphql/generated/graphql'
import type {
  ImportIssue,
  ImportResult,
  NoteKind,
  NutritionBuild,
  NutritionKind,
  RecipeCard,
  RecipeDetail,
  RecipeStatus,
  StepPhase,
} from '@/libs/recipes'
import type { RecipeImportInput } from '@/validations'

import {
  ImportRecipeStatus,
  PublishStatus,
  useImportRecipeMutation,
  useSetRecipeStatusMutation,
} from '@/graphql/generated/graphql'

// GraphQL Operations
export const IMPORT_RECIPE = gql`
  mutation ImportRecipe(
    $recipe: JSON!
    $overwrite: Boolean!
    $dryRun: Boolean!
    $recipeId: ID
  ) {
    importRecipe(
      recipe: $recipe
      overwrite: $overwrite
      dryRun: $dryRun
      recipeId: $recipeId
    ) {
      status
      slug
      id
      issues {
        path
        message
      }
      changes {
        path
        before
        after
      }
    }
  }
`

export const SET_RECIPE_STATUS = gql`
  mutation SetRecipeStatus($id: ID!, $status: PublishStatus!) {
    setRecipeStatus(id: $id, status: $status) {
      id
      slug
      status
    }
  }
`

// Reads. Server components run these in-process (see src/graphql/execute.ts), so nothing
// here talks to the network.
export const RECIPE_CARDS = gql`
  query RecipeCards {
    recipeCards {
      slug
      title
      summary
      imageUrl
      servings
      totalMinutes
      costTier
      difficulty
      tags
      calories
      proteinG
      carbsG
      fatG
      original {
        proteinG
        carbsG
        fatG
      }
    }
  }
`

export const RECIPE = gql`
  query Recipe($slug: String!) {
    recipe(slug: $slug) {
      id
      slug
      title
      summary
      imageUrl
      servings
      prepMinutes
      cookMinutes
      totalMinutes
      costTier
      difficulty
      tags
      nutrition {
        kind
        label
        isDefault
        calories
        proteinG
        carbsG
        fatG
      }
      featured {
        kind
        label
        isDefault
        calories
        proteinG
        carbsG
        fatG
      }
      ingredients {
        group
        raw
      }
      steps {
        phase
        body
        durationMinutes
      }
      nutritionIntro
      nutritionAnalysis
      notes {
        kind
        body
      }
      baseRecipe {
        slug
        title
      }
      variants {
        slug
        title
      }
    }
  }
`

export const RECIPE_SLUGS = gql`
  query RecipeSlugs {
    recipeSlugs
  }
`

export const RECIPE_SLUGS_BY_INGREDIENT = gql`
  query RecipeSlugsByIngredient($search: String!) {
    recipeSlugsByIngredient(search: $search)
  }
`

export const ADMIN_RECIPES = gql`
  query AdminRecipes {
    adminRecipes {
      id
      slug
      title
      status
      updatedAt
    }
  }
`

export const EDITABLE_RECIPE = gql`
  query EditableRecipe($id: ID!) {
    editableRecipe(id: $id) {
      id
      status
      recipe
    }
  }
`

// Hooks for components
export const useImportRecipe = () => useImportRecipeMutation()

type ImportRecipePayload = ImportRecipeMutation['importRecipe']

// Back to the shape the result panel renders, so the panel does not depend on GraphQL types.
// GraphQL sends null for a missing value where the diff means "not there", hence the ?? undefined.
export const toImportResult = ({
  status,
  slug,
  id,
  issues,
  changes,
}: ImportRecipePayload): ImportResult => {
  const fieldChanges = changes.map(({ path, before, after }) => ({
    path,
    before: before ?? undefined,
    after: after ?? undefined,
  }))

  switch (status) {
    case ImportRecipeStatus.Invalid:
      return { status: 'invalid', issues: [...issues] }
    case ImportRecipeStatus.Created:
      return { status: 'created', slug: slug ?? '', ...(id ? { id } : {}) }
    case ImportRecipeStatus.Updated:
      return {
        status: 'updated',
        slug: slug ?? '',
        changes: fieldChanges,
        ...(id ? { id } : {}),
      }
    case ImportRecipeStatus.Unchanged:
      return { status: 'unchanged', slug: slug ?? '', id: id ?? '' }
    case ImportRecipeStatus.Conflict:
      return { status: 'conflict', slug: slug ?? '', changes: fieldChanges }
  }
}

export type SaveRecipeResult =
  | { ok: true; id: string; slug: string; summary: string }
  | { ok: false; error: string; issues?: ImportIssue[] }

// What the recipe editor shows for each outcome of a save
export const toSaveRecipeResult = (result: ImportResult): SaveRecipeResult => {
  switch (result.status) {
    case 'invalid':
      return {
        ok: false,
        error: 'Fix these fields and save again.',
        issues: result.issues,
      }
    case 'conflict':
      return { ok: false, error: 'A recipe with that slug already exists.' }
    case 'unchanged':
      return {
        ok: true,
        id: result.id,
        slug: result.slug,
        summary: 'No changes to save.',
      }
    case 'created':
    case 'updated':
      return result.id
        ? {
            ok: true,
            id: result.id,
            slug: result.slug,
            summary:
              result.status === 'created' ? 'Saved as a draft.' : 'Saved.',
          }
        : { ok: false, error: 'The save did not finish.' }
  }
}

// Saves from the recipe editor through the same mutation as the import page. Editing passes
// the recipe's id, which overwrites it and keeps its slug fixed. Creating never overwrites.
export const useSaveRecipe = (): ((
  recipeId: string | undefined,
  input: unknown
) => Promise<SaveRecipeResult>) => {
  const [importRecipe] = useImportRecipe()

  return async (recipeId, input) => {
    try {
      const { data } = await importRecipe({
        variables: {
          recipe: input,
          overwrite: Boolean(recipeId),
          dryRun: false,
          ...(recipeId ? { recipeId } : {}),
        },
      })
      if (!data) return { ok: false, error: 'The save returned no data.' }
      return toSaveRecipeResult(toImportResult(data.importRecipe))
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'The save failed.',
      }
    }
  }
}

// Publishes or unpublishes a recipe. Throws when the server refuses.
export const useSetRecipeStatus = (): ((
  id: string,
  status: RecipeStatus
) => Promise<void>) => {
  const [setRecipeStatus] = useSetRecipeStatusMutation()

  return async (id, status) => {
    await setRecipeStatus({
      variables: {
        id,
        status:
          status === 'published'
            ? PublishStatus.Published
            : PublishStatus.Draft,
      },
    })
  }
}

// Kinds and statuses travel as plain strings, so narrow them back to the unions the pages use.
// An unknown value means the data is broken, which should fail loudly instead of rendering.
const oneOf = <T extends string>(
  allowed: readonly T[],
  value: string,
  label: string
): T => {
  const match = allowed.find((option) => option === value)
  if (!match) throw new Error(`Unexpected ${label} "${value}"`)
  return match
}

const NUTRITION_KINDS: readonly NutritionKind[] = ['makeover', 'traditional']
const STEP_PHASES: readonly StepPhase[] = ['prep', 'cook']
const NOTE_KINDS: readonly NoteKind[] = [
  'make_or_break',
  'fixes',
  'levers',
  'tip',
  'nutrition_intro',
  'nutrition_analysis',
]
const STATUSES: readonly RecipeStatus[] = ['draft', 'published']

// GraphQL sends null where the pages expect a missing value
export const readRecipeCards = ({
  recipeCards,
}: RecipeCardsQuery): RecipeCard[] =>
  recipeCards.map((card) => ({
    slug: card.slug,
    title: card.title,
    summary: card.summary,
    imageUrl: card.imageUrl ?? undefined,
    servings: card.servings,
    totalMinutes: card.totalMinutes,
    costTier: card.costTier,
    difficulty: card.difficulty,
    tags: [...card.tags],
    calories: card.calories,
    proteinG: card.proteinG,
    carbsG: card.carbsG,
    fatG: card.fatG,
    original: card.original
      ? {
          proteinG: card.original.proteinG,
          carbsG: card.original.carbsG,
          fatG: card.original.fatG,
        }
      : undefined,
  }))

type BuildPayload = NonNullable<RecipeQuery['recipe']>['featured']

const readBuild = (build: BuildPayload): NutritionBuild => ({
  kind: oneOf(NUTRITION_KINDS, build.kind, 'nutrition kind'),
  label: build.label,
  isDefault: build.isDefault,
  calories: build.calories,
  proteinG: build.proteinG,
  carbsG: build.carbsG,
  fatG: build.fatG,
})

export const readRecipeDetail = ({
  recipe,
}: RecipeQuery): RecipeDetail | undefined => {
  if (!recipe) return undefined

  return {
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    summary: recipe.summary,
    imageUrl: recipe.imageUrl ?? undefined,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    totalMinutes: recipe.totalMinutes,
    costTier: recipe.costTier,
    difficulty: recipe.difficulty,
    tags: [...recipe.tags],
    nutrition: recipe.nutrition.map(readBuild),
    featured: readBuild(recipe.featured),
    ingredients: recipe.ingredients.map(({ group, raw }) => ({
      group: group ?? undefined,
      raw,
    })),
    steps: recipe.steps.map(({ phase, body, durationMinutes }) => ({
      phase: oneOf(STEP_PHASES, phase, 'step phase'),
      body,
      durationMinutes: durationMinutes ?? undefined,
    })),
    nutritionIntro: [...recipe.nutritionIntro],
    nutritionAnalysis: [...recipe.nutritionAnalysis],
    notes: recipe.notes.map(({ kind, body }) => ({
      kind: oneOf(NOTE_KINDS, kind, 'note kind'),
      body,
    })),
    baseRecipe: recipe.baseRecipe
      ? { slug: recipe.baseRecipe.slug, title: recipe.baseRecipe.title }
      : undefined,
    variants: recipe.variants.map(({ slug, title }) => ({ slug, title })),
  }
}

type AdminRecipeRow = {
  id: string
  slug: string
  title: string
  status: RecipeStatus
  updatedAt: string
}

export const readAdminRecipes = ({
  adminRecipes,
}: AdminRecipesQuery): AdminRecipeRow[] =>
  adminRecipes.map(({ id, slug, title, status, updatedAt }) => ({
    id,
    slug,
    title,
    status: oneOf(STATUSES, status, 'recipe status'),
    updatedAt,
  }))

type EditableRecipeData = {
  status: RecipeStatus
  recipe: RecipeImportInput
}

// The recipe is JSON the server already validated against the import schema
export const readEditableRecipe = ({
  editableRecipe,
}: EditableRecipeQuery): EditableRecipeData | undefined =>
  editableRecipe
    ? {
        status: oneOf(STATUSES, editableRecipe.status, 'recipe status'),
        recipe: editableRecipe.recipe as RecipeImportInput,
      }
    : undefined
