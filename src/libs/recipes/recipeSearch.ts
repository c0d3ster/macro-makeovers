import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/libs/supabase/database.types'

// Slugs of published recipes with an ingredient matching the search text. Uses the generated
// tsvector on ingredients.raw_text, so "chicken thigh" also finds "chicken thighs".
export const findRecipeSlugsByIngredient = async (
  client: SupabaseClient<Database>,
  q: string
): Promise<Set<string>> => {
  const { data, error } = await client
    .from('ingredients')
    .select('recipes!inner(slug, status)')
    .eq('recipes.status', 'published')
    .textSearch('search', q, { type: 'websearch', config: 'english' })
  if (error) throw new Error(`Could not search ingredients: ${error.message}`)

  return new Set(data.flatMap(({ recipes }) => (recipes ? [recipes.slug] : [])))
}

// Tag names become lowercase path segments, e.g. "Meal Prep" is /tags/meal%20prep
export const toTagPath = (tag: string): string =>
  `/tags/${encodeURIComponent(tag.toLowerCase())}`
