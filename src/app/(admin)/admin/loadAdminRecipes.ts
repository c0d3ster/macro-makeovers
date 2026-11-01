import type {
  AdminRecipesQuery,
  EditableRecipeQuery,
} from '@/graphql/generated/graphql'

import { readAdminRecipes, readEditableRecipe } from '@/apiClients'
import { runSessionQuery } from '@/graphql/execute'
import {
  AdminRecipesDocument,
  EditableRecipeDocument,
} from '@/graphql/generated/graphql'

// Both run as the signed-in visitor, and the queries themselves refuse anyone but the owner

// Drafts and published recipes together, newest edit first
export const loadAdminRecipes = async () =>
  readAdminRecipes(
    await runSessionQuery<AdminRecipesQuery>(AdminRecipesDocument)
  )

// The stored recipe in import shape, or undefined when the id is unknown
export const loadEditableRecipe = async (id: string) =>
  readEditableRecipe(
    await runSessionQuery<EditableRecipeQuery>(EditableRecipeDocument, { id })
  )
