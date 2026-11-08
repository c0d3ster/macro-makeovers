import type { RecipeCard } from './recipeCards'

// Grams of fat per serving the makeover saves over the traditional version. Zero without one.
export const fatCut = ({ fatG, original }: RecipeCard): number =>
  original ? Math.max(0, original.fatG - fatG) : 0

// The home page's featured recipes: the biggest makeovers first, by fat cut per serving, so
// the before-and-after story leads. Recipes with no traditional version fill in after, in
// their original order.
export const pickFeaturedRecipes = (
  recipes: RecipeCard[],
  count: number
): RecipeCard[] =>
  recipes
    .map((recipe, index) => ({ recipe, index, cut: fatCut(recipe) }))
    .sort((a, b) => b.cut - a.cut || a.index - b.index)
    .slice(0, count)
    .map(({ recipe }) => recipe)
