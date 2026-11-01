import { revalidatePath } from 'next/cache'

// Public pages that list or show a recipe, refreshed right away instead of waiting out the cache
export const revalidateRecipePages = (slug: string): void => {
  revalidatePath('/')
  revalidatePath('/tags/[tag]', 'page')
  revalidatePath(`/recipes/${slug}`)
}
