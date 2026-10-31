import type {
  RecipeCard,
  RecipeFilters,
  TagGroups,
  UnavailableOptions,
} from '@/libs/recipes'

import { logger } from '@/libs/Logger'
import {
  filterRecipes,
  findRecipeSlugsByIngredient,
  findUnavailableOptions,
  groupTags,
  listRecipeCards,
} from '@/libs/recipes'
import { createPublicClient } from '@/libs/supabase/public'

type RecipeBrowse = {
  // Every published recipe, for building the tag list
  all: RecipeCard[]
  // The recipes left after applying the filters
  visible: RecipeCard[]
  tagGroups: TagGroups
  // Filter options that would return nothing on top of the current filters
  unavailable: UnavailableOptions
}

// Shared by the home grid and the tag pages. Returns undefined when recipes can't be loaded,
// so the page can show an empty state instead of failing the whole site.
export const loadRecipeBrowse = async (
  filters: RecipeFilters
): Promise<RecipeBrowse | undefined> => {
  try {
    const client = createPublicClient()
    const all = await listRecipeCards(client)
    // A failed ingredient search still leaves title, summary, and tag search working
    const ingredientMatches = filters.q
      ? await findRecipeSlugsByIngredient(client, filters.q).catch((error) => {
          logger.error('Could not search ingredients', { error })
          return new Set<string>()
        })
      : new Set<string>()
    const tagGroups = groupTags(all)

    return {
      all,
      visible: filterRecipes(all, filters, ingredientMatches),
      tagGroups,
      unavailable: findUnavailableOptions(
        all,
        filters,
        ingredientMatches,
        tagGroups
      ),
    }
  } catch (error) {
    logger.error('Could not load recipes', { error })
    return undefined
  }
}
