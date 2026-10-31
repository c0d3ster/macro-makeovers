import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/libs/supabase/database.types'
import type { RecipeImportInput } from '@/validations'

import { recipeImportSchema } from '@/validations'

export type RecipeStatus = Database['public']['Enums']['recipe_status']

// One row of the admin list: drafts and published recipes together
type AdminRecipe = {
  id: string
  slug: string
  title: string
  status: RecipeStatus
  updatedAt: string
}

// Needs a client that can see drafts: the service role, after an owner check
export const listAdminRecipes = async (
  client: SupabaseClient<Database>
): Promise<AdminRecipe[]> => {
  const { data, error } = await client
    .from('recipes')
    .select('id, slug, title, status, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(`Could not load recipes: ${error.message}`)

  return data.map(({ updated_at, ...row }) => ({
    ...row,
    updatedAt: updated_at,
  }))
}

// Returns the recipe's slug so the caller can refresh the public pages it appears on
export const setRecipeStatus = async (
  client: SupabaseClient<Database>,
  id: string,
  status: RecipeStatus
): Promise<string> => {
  const { data, error } = await client
    .from('recipes')
    .update({ status })
    .eq('id', id)
    .select('slug')
    .single()
  if (error) throw new Error(`Could not update the recipe: ${error.message}`)
  return data.slug
}

// The stored recipe in the shape the editor and importer share, or undefined if the id is
// unknown or the stored data no longer matches the schema
export const getRecipeForEdit = async (
  client: SupabaseClient<Database>,
  id: string
): Promise<RecipeImportInput | undefined> => {
  const { data, error } = await client.rpc('recipe_snapshot', {
    p_recipe_id: id,
  })
  if (error) throw new Error(`Could not read recipe ${id}: ${error.message}`)

  const parsed = recipeImportSchema.safeParse(data)
  return parsed.success ? parsed.data : undefined
}
