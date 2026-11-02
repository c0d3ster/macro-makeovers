// The placeholder photo step, separate from the import. Every outside call is injected, so the
// flow is tested without OpenAI, R2, or a database.

export type PhotoRecipe = {
  id: string
  slug: string
  title: string
  summary: string
}

export type PhotoDeps = {
  generateImage: (prompt: string) => Promise<Uint8Array>
  // Stores the bytes under the key and returns the public URL
  uploadImage: (key: string, bytes: Uint8Array) => Promise<string>
  // Writes the URL only if the recipe still has no photo. False means it had one.
  saveImageUrl: (id: string, url: string) => Promise<boolean>
}

export type PhotoOutcome = 'saved' | 'skipped-existing'

export const buildPhotoPrompt = ({
  title,
  summary,
}: Pick<PhotoRecipe, 'title' | 'summary'>): string =>
  `Appetizing overhead food photograph of ${title}. ${summary} ` +
  'Natural light, plated on a simple table, shallow depth of field. ' +
  'No text, no labels, no people, no hands.'

export const photoKey = (slug: string, now: number = Date.now()): string =>
  `recipes/${slug}-placeholder-${now}.png`

// Throws on any failure. The caller decides that a failure is only logged.
export const createPlaceholderPhoto = async (
  deps: PhotoDeps,
  recipe: PhotoRecipe
): Promise<PhotoOutcome> => {
  const bytes = await deps.generateImage(buildPhotoPrompt(recipe))
  const url = await deps.uploadImage(photoKey(recipe.slug), bytes)
  const saved = await deps.saveImageUrl(recipe.id, url)
  return saved ? 'saved' : 'skipped-existing'
}
