import gql from 'graphql-tag'

import type { ImportRecipeMutation } from '@/graphql/generated/graphql'
import type { ImportResult } from '@/libs/recipes'

import {
  ImportRecipeStatus,
  useImportRecipeMutation,
} from '@/graphql/generated/graphql'

// GraphQL Operations
export const IMPORT_RECIPE = gql`
  mutation ImportRecipe(
    $recipe: JSON!
    $overwrite: Boolean!
    $dryRun: Boolean!
  ) {
    importRecipe(recipe: $recipe, overwrite: $overwrite, dryRun: $dryRun) {
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
