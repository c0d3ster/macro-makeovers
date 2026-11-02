import gql from 'graphql-tag'

import type { ImportRecipeMutation } from '@/graphql/generated/graphql'
import type { ImportIssue, ImportResult, RecipeStatus } from '@/libs/recipes'

import {
  ImportRecipeStatus,
  PublishStatus,
  useDeleteRecipeMutation,
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

export const DELETE_RECIPE = gql`
  mutation DeleteRecipe($id: ID!) {
    deleteRecipe(id: $id)
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

// Deletes a recipe for good. Throws with the server's message when it refuses, for example
// while the recipe still has variants.
export const useDeleteRecipe = (): ((id: string) => Promise<void>) => {
  const [deleteRecipe] = useDeleteRecipeMutation()

  return async (id) => {
    await deleteRecipe({ variables: { id } })
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
