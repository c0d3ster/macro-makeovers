import type { RecipeImport } from '@/validations'

import { recipeImportSchema } from '@/validations'

import type { FieldChange } from './diffRecipe'
import type { RecipeStore } from './recipeStore'

import { diffRecipes } from './diffRecipe'

export type ImportIssue = {
  // Field the problem is on, e.g. `nutrition[1].calories`
  path: string
  message: string
}

export type ImportResult =
  | { status: 'invalid'; issues: ImportIssue[] }
  | { status: 'created'; slug: string; id?: string }
  | { status: 'updated'; slug: string; changes: FieldChange[]; id?: string }
  | { status: 'unchanged'; slug: string; id: string }
  // The slug already exists and overwrite was not requested
  | { status: 'conflict'; slug: string; changes: FieldChange[] }

type ImportOptions = {
  // Replace an existing recipe with the same slug
  overwrite?: boolean
  // Validate and diff without writing anything
  dryRun?: boolean
}

const formatPath = (path: PropertyKey[]): string =>
  path.reduce<string>((result, part) => {
    if (typeof part === 'number') return `${result}[${part}]`
    const name = String(part)
    return result ? `${result}.${name}` : name
  }, '')

const loadStoredRecipe = async (
  store: RecipeStore,
  id: string
): Promise<RecipeImport> => {
  const parsed = recipeImportSchema.safeParse(await store.getSnapshot(id))
  if (!parsed.success) {
    throw new Error(
      `Stored recipe ${id} no longer matches the import schema: ${parsed.error.message}`
    )
  }
  return parsed.data
}

// The one way a recipe enters the database. Validates against the shared schema, then
// upserts by slug in a single transaction. A new slug lands as a draft; an existing one
// is only replaced with `overwrite`, and the result lists the field-level changes.
export const importRecipe = async (
  store: RecipeStore,
  input: unknown,
  { overwrite = false, dryRun = false }: ImportOptions = {}
): Promise<ImportResult> => {
  const parsed = recipeImportSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: 'invalid',
      issues: parsed.error.issues.map(({ path, message }) => ({
        path: formatPath(path),
        message,
      })),
    }
  }

  const recipe = parsed.data
  const existingId = await store.findIdBySlug(recipe.slug)

  if (!existingId) {
    if (dryRun) return { status: 'created', slug: recipe.slug }
    return {
      status: 'created',
      slug: recipe.slug,
      id: await store.write(recipe),
    }
  }

  const changes = diffRecipes(await loadStoredRecipe(store, existingId), recipe)
  if (changes.length === 0) {
    return { status: 'unchanged', slug: recipe.slug, id: existingId }
  }
  if (!overwrite) return { status: 'conflict', slug: recipe.slug, changes }
  if (dryRun) return { status: 'updated', slug: recipe.slug, changes }

  return {
    status: 'updated',
    slug: recipe.slug,
    changes,
    id: await store.write(recipe),
  }
}
