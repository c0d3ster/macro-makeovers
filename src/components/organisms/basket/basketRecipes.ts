// What the basket shows for each recipe, looked up on the server so the client stays small
export type BasketRecipeInfo = {
  title: string
  imageUrl?: string
}

// Keyed by slug, with each non-default build under `slug?build=key`
export type BasketRecipeLookup = Record<string, BasketRecipeInfo>

export const basketRecipeKey = (slug: string, build?: string): string =>
  build ? `${slug}?build=${build}` : slug

// "spicy-turkey-chili" reads "Spicy turkey chili" when the recipe list can't be loaded
const titleFromSlug = (slug: string): string => {
  const words = slug.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// A build the lookup does not know reads as the recipe
export const recipeInfo = (
  recipes: BasketRecipeLookup,
  slug: string,
  build?: string
): BasketRecipeInfo =>
  recipes[basketRecipeKey(slug, build)] ??
  recipes[slug] ?? { title: titleFromSlug(slug) }
