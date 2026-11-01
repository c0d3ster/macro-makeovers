import type { RecipeImport } from '@/validations'

import { recipeImportSchema } from '@/validations'

import type { FieldChange } from './diffRecipe'

import { diffRecipes } from './diffRecipe'
import { RecipeRuleError } from './recipeRuleError'

// What importRecipe calls on the repository. A type of its own, so the import rules can be
// tested with plain functions and no database. RecipeRepository satisfies it.
export type ImportRepository = {
  getRecipeIdBySlug: (slug: string) => Promise<string | undefined>
  getRecipe: (id: string) => Promise<unknown>
  validateRecipe: (recipe: RecipeImport) => Promise<void>
  createRecipe: (recipe: RecipeImport) => Promise<string>
  updateRecipe: (id: string, recipe: RecipeImport) => Promise<string>
}

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
  // Set when editing a known recipe. The slug has to belong to it, because the slug is the
  // recipe's address and an edit may not quietly point at a different recipe.
  recipeId?: string
}

const formatPath = (path: PropertyKey[]): string =>
  path.reduce<string>((result, part) => {
    if (typeof part === 'number') return `${result}[${part}]`
    const name = String(part)
    return result ? `${result}.${name}` : name
  }, '')

const loadStoredRecipe = async (
  repository: ImportRepository,
  id: string
): Promise<RecipeImport> => {
  const parsed = recipeImportSchema.safeParse(await repository.getRecipe(id))
  if (!parsed.success) {
    throw new Error(
      `Stored recipe ${id} no longer matches the import schema: ${parsed.error.message}`
    )
  }
  return parsed.data
}

const ruleIssue = (error: unknown): ImportResult | undefined =>
  error instanceof RecipeRuleError
    ? {
        status: 'invalid',
        issues: [{ path: error.path, message: error.message }],
      }
    : undefined

// The one way a recipe enters the database. Validates against the shared schema, then
// upserts by slug in a single transaction. A new slug lands as a draft; an existing one
// is only replaced with `overwrite`, and the result lists the field-level changes.
export const importRecipe = async (
  repository: ImportRepository,
  input: unknown,
  { overwrite = false, dryRun = false, recipeId }: ImportOptions = {}
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
  const existingId = await repository.getRecipeIdBySlug(recipe.slug)

  if (recipeId && existingId !== recipeId) {
    return {
      status: 'invalid',
      issues: [
        { path: 'slug', message: 'The slug cannot change once a recipe exists' },
      ],
    }
  }

  try {
    await repository.validateRecipe(recipe)
  } catch (error) {
    const issue = ruleIssue(error)
    if (issue) return issue
    throw error
  }

  // Create and update enforce the rules again, in case something changed since the check
  const save = async (
    write: () => Promise<string>
  ): Promise<string | ImportResult> => {
    try {
      return await write()
    } catch (error) {
      const issue = ruleIssue(error)
      if (issue) return issue
      throw error
    }
  }

  if (!existingId) {
    if (dryRun) return { status: 'created', slug: recipe.slug }
    const id = await save(() => repository.createRecipe(recipe))
    return typeof id === 'string'
      ? { status: 'created', slug: recipe.slug, id }
      : id
  }

  const changes = diffRecipes(await loadStoredRecipe(repository, existingId), recipe)
  if (changes.length === 0) {
    return { status: 'unchanged', slug: recipe.slug, id: existingId }
  }
  if (!overwrite) return { status: 'conflict', slug: recipe.slug, changes }
  if (dryRun) return { status: 'updated', slug: recipe.slug, changes }

  const id = await save(() => repository.updateRecipe(existingId, recipe))
  return typeof id === 'string'
    ? { status: 'updated', slug: recipe.slug, changes, id }
    : id
}
