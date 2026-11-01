import type {
  RecipeCardsQuery,
  RecipeSlugsByIngredientQuery,
} from '@/graphql/generated/graphql'
import type {
  Fit,
  RecipeCard,
  RecipeFilters,
  TagGroups,
  UnavailableOptions,
} from '@/libs/recipes'

import { readRecipeCards } from '@/apiClients'
import { runPublicQuery } from '@/graphql/execute'
import {
  RecipeCardsDocument,
  RecipeSlugsByIngredientDocument,
} from '@/graphql/generated/graphql'
import { logger } from '@/libs/Logger'
import {
  evaluateFit,
  filterRecipes,
  findUnavailableOptions,
  groupTags,
  resolveTarget,
} from '@/libs/recipes'

type RecipeBrowse = {
  // Every published recipe, for building the tag list
  all: RecipeCard[]
  // The recipes left after applying the filters
  visible: RecipeCard[]
  tagGroups: TagGroups
  // How each visible recipe fits the goal or macro targets, by slug. Missing with no target.
  fits?: Record<string, Fit>
  // Filter options that would return nothing on top of the current filters
  unavailable: UnavailableOptions
}

// Slugs of published recipes with an ingredient matching the search text
const searchIngredients = async (search: string): Promise<Set<string>> => {
  const { recipeSlugsByIngredient } =
    await runPublicQuery<RecipeSlugsByIngredientQuery>(
      RecipeSlugsByIngredientDocument,
      { search }
    )
  return new Set(recipeSlugsByIngredient)
}

// Shared by the home grid and the tag pages. Returns undefined when recipes can't be loaded,
// so the page can show an empty state instead of failing the whole site.
export const loadRecipeBrowse = async (
  filters: RecipeFilters
): Promise<RecipeBrowse | undefined> => {
  try {
    const all = readRecipeCards(
      await runPublicQuery<RecipeCardsQuery>(RecipeCardsDocument)
    )
    // A failed ingredient search still leaves title, summary, and tag search working
    const ingredientMatches = filters.q
      ? await searchIngredients(filters.q).catch((error) => {
          logger.error('Could not search ingredients', { error })
          return new Set<string>()
        })
      : new Set<string>()
    const tagGroups = groupTags(all)
    const visible = filterRecipes(all, filters, ingredientMatches)
    const target = resolveTarget(filters)

    return {
      all,
      visible,
      tagGroups,
      fits: target
        ? Object.fromEntries(
            visible.map((recipe) => [recipe.slug, evaluateFit(recipe, target)])
          )
        : undefined,
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
