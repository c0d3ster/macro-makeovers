import { notFound } from 'next/navigation'

import type { RecipeStatus } from '@/libs/recipes'
import type { AdminRecipe } from '@/libs/recipes/RecipeRepository'
import type { RecipeImportInput } from '@/validations'

import { isOwner } from '@/libs/supabase/owner'
import { services } from '@/services'

type EditableRecipeData = {
  status: RecipeStatus
  recipe: RecipeImportInput
}

// These read drafts through a connection that bypasses RLS. The admin layout already turns
// non-owners away, but a layout does not re-run on every navigation, so each read checks too.
const requireOwner = async (): Promise<void> => {
  if (!(await isOwner())) notFound()
}

// Drafts and published recipes together, newest edit first
export const loadAdminRecipes = async (): Promise<AdminRecipe[]> => {
  await requireOwner()
  return services.recipeService.getAdminRecipes()
}

// The stored recipe in import shape, or undefined when the id is unknown
export const loadEditableRecipe = async (
  id: string
): Promise<EditableRecipeData | undefined> => {
  await requireOwner()

  const editable = await services.recipeService.getEditableRecipe(id)
  if (!editable) return undefined

  // The service already validated the recipe against the import schema
  return {
    status: editable.status,
    recipe: editable.recipe as RecipeImportInput,
  }
}
