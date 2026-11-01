import { cache } from 'react'

import type { RecipeQuery, RecipeSlugsQuery } from '@/graphql/generated/graphql'
import type { RecipeDetail } from '@/libs/recipes'

import { readRecipeDetail } from '@/apiClients'
import { runPublicQuery } from '@/graphql/execute'
import {
  RecipeDocument,
  RecipeSlugsDocument,
} from '@/graphql/generated/graphql'

// Metadata, the page, and the share image all need the same recipe in one request,
// so this reads it once per render pass
export const loadRecipe = cache(
  async (slug: string): Promise<RecipeDetail | undefined> =>
    readRecipeDetail(
      await runPublicQuery<RecipeQuery>(RecipeDocument, { slug })
    )
)

// Every published slug, variants included, so each recipe page can be built ahead of time
export const loadRecipeSlugs = async (): Promise<string[]> => {
  const { recipeSlugs } =
    await runPublicQuery<RecipeSlugsQuery>(RecipeSlugsDocument)
  return [...recipeSlugs]
}
