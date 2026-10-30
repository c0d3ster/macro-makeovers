import { cache } from 'react'

import type { RecipeDetail } from '@/libs/recipes'

import { getRecipeDetail } from '@/libs/recipes'
import { createPublicClient } from '@/libs/supabase/public'

// Metadata, the page, and the share image all need the same recipe in one request,
// so this reads it once per render pass
export const loadRecipe = cache(
  (slug: string): Promise<RecipeDetail | undefined> =>
    getRecipeDetail(createPublicClient(), slug)
)
