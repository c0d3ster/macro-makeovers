import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/libs/supabase/database.types'

export type RecipeStatus = Database['public']['Enums']['recipe_status']

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
