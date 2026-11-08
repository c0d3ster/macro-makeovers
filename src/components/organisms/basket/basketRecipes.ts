// What the basket shows for each recipe, looked up on the server so the client stays small
export type BasketRecipeInfo = {
  title: string
  imageUrl?: string
}

export type BasketRecipeLookup = Record<string, BasketRecipeInfo>

// "spicy-turkey-chili" reads "Spicy turkey chili" when the recipe list can't be loaded
const titleFromSlug = (slug: string): string => {
  const words = slug.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export const recipeInfo = (
  recipes: BasketRecipeLookup,
  slug: string
): BasketRecipeInfo => recipes[slug] ?? { title: titleFromSlug(slug) }
