import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/libs/supabase/database.types'
import type { RecipeImport } from '@/validations'

// What importRecipe needs from the database, so the logic can be tested without one
export type RecipeStore = {
  findIdBySlug: (slug: string) => Promise<string | undefined>
  // The stored recipe in import shape, to be validated by the caller
  getSnapshot: (id: string) => Promise<unknown>
  write: (recipe: RecipeImport) => Promise<string>
}

// Backed by Supabase. Needs a service role client (see createAdminClient).
export const createSupabaseRecipeStore = (
  client: SupabaseClient<Database>
): RecipeStore => ({
  findIdBySlug: async (slug) => {
    const { data, error } = await client
      .from('recipes')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (error) throw new Error(`Could not look up "${slug}": ${error.message}`)
    return data?.id
  },

  getSnapshot: async (id) => {
    const { data, error } = await client.rpc('recipe_snapshot', {
      p_recipe_id: id,
    })
    if (error) throw new Error(`Could not read recipe ${id}: ${error.message}`)
    return data
  },

  write: async (recipe) => {
    const { data, error } = await client.rpc('import_recipe', {
      p_recipe: recipe,
    })
    if (error) {
      throw new Error(`Import of "${recipe.slug}" failed: ${error.message}`)
    }
    return data
  },
})
