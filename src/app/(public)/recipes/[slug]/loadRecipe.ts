import { cache } from 'react'

import type { RecipeDetail } from '@/libs/recipes'

import { services } from '@/services'

// Metadata, the page, and the share image all need the same recipe in one request,
// so this reads it once per render pass
export const loadRecipe = cache(
  (slug: string): Promise<RecipeDetail | undefined> =>
    services.recipeService.getRecipe(slug)
)

// Every published slug, variants included, so each recipe page can be built ahead of time
export const loadRecipeSlugs = (): Promise<string[]> =>
  services.recipeService.getRecipeSlugs()
