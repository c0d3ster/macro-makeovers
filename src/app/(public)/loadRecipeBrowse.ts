import type {
  Fit,
  IngredientMatches,
  RecipeCard,
  RecipeFilters,
  TagGroups,
  UnavailableOptions,
} from '@/libs/recipes'

import { logger } from '@/libs/Logger'
import {
  cardsForCourses,
  DISH_COURSES,
  evaluateFit,
  filterRecipes,
  findUnavailableOptions,
  groupTags,
  resolveTarget,
  SIDE_COURSES,
  toIngredientMatches,
} from '@/libs/recipes'
import { services } from '@/services'

type RecipeBrowse = {
  // Every published dish (breakfasts, appetizers, mains), for building the tag list
  all: RecipeCard[]
  // Sides and sauces, shown apart as compact cards and left out of filters and goal matching
  sides: RecipeCard[]
  // The recipes left after applying the filters
  visible: RecipeCard[]
  tagGroups: TagGroups
  // How each visible recipe fits the goal or macro targets, by slug. Missing with no target.
  fits?: Record<string, Fit>
  // Filter options that would return nothing on top of the current filters
  unavailable: UnavailableOptions
}

// Ingredient lines of published recipes matching the search text
const searchIngredients = async (search: string): Promise<IngredientMatches> =>
  toIngredientMatches(await services.recipeService.getIngredientMatches(search))

// Shared by the home grid and the tag pages. Returns undefined when recipes can't be loaded,
// so the page can show an empty state instead of failing the whole site.
export const loadRecipeBrowse = async (
  filters: RecipeFilters
): Promise<RecipeBrowse | undefined> => {
  try {
    const cards = await services.recipeService.getRecipeCards()
    const all = cardsForCourses(cards, DISH_COURSES)
    // A failed ingredient search still leaves title, summary, and tag search working
    const ingredientMatches = filters.q
      ? await searchIngredients(filters.q).catch((error) => {
          logger.error('Could not search ingredients', { error })
          return new Map()
        })
      : new Map()
    const tagGroups = groupTags(all)
    const visible = filterRecipes(all, filters, ingredientMatches)
    const target = resolveTarget(filters)

    return {
      all,
      sides: cardsForCourses(cards, SIDE_COURSES),
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
