import { notFound } from 'next/navigation'

import type { RecipeDetail, RecipeStatus } from '@/libs/recipes'
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

// A recipe as its public page would show it, drafts included, or undefined when the id is
// unknown or the recipe has no makeover build to lead with
export const loadRecipePreview = async (
  id: string
): Promise<{ status: RecipeStatus; recipe: RecipeDetail } | undefined> => {
  await requireOwner()
  return services.recipeService.getRecipePreview(id)
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
