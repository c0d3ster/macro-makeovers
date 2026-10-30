'use server'

import { revalidatePath } from 'next/cache'

import type { SaveRecipeResult } from '@/components/organisms'

import { createSupabaseRecipeStore, importRecipe } from '@/libs/recipes'
import { createAdminClient } from '@/libs/supabase/admin'
import { isOwner } from '@/libs/supabase/owner'

import { revalidateRecipePages } from '../revalidateRecipePages'

const slugOf = (input: unknown): string | undefined =>
  typeof input === 'object' &&
  input !== null &&
  'slug' in input &&
  typeof input.slug === 'string'
    ? input.slug
    : undefined

// Saves through the same importRecipe path as the paste page, so validation, the single
// transaction, and the revision written on every save are shared. Checks who is asking
// before touching the service role client, which bypasses RLS.
export const saveRecipeAction = async (
  recipeId: string | undefined,
  input: unknown
): Promise<SaveRecipeResult> => {
  if (!(await isOwner())) {
    return { ok: false, error: 'Only the site owner can save recipes.' }
  }

  try {
    const store = createSupabaseRecipeStore(createAdminClient())

    // The slug is the recipe's address, so an edit may not point at a different recipe
    const slug = slugOf(input)
    if (recipeId && slug && (await store.findIdBySlug(slug)) !== recipeId) {
      return { ok: false, error: 'The slug cannot change once a recipe exists.' }
    }

    const result = await importRecipe(store, input, {
      overwrite: Boolean(recipeId),
    })

    switch (result.status) {
      case 'invalid':
        return {
          ok: false,
          error: 'Fix these fields and save again.',
          issues: result.issues,
        }
      case 'conflict':
        return { ok: false, error: 'A recipe with that slug already exists.' }
      case 'unchanged':
        return {
          ok: true,
          id: result.id,
          slug: result.slug,
          summary: 'No changes to save.',
        }
      case 'created':
      case 'updated': {
        if (!result.id) return { ok: false, error: 'The save did not finish.' }
        revalidateRecipePages(result.slug)
        revalidatePath('/admin')
        return {
          ok: true,
          id: result.id,
          slug: result.slug,
          summary: result.status === 'created' ? 'Saved as a draft.' : 'Saved.',
        }
      }
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'The save failed.',
    }
  }
}
