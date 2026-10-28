'use server'

import type {
  ImportIntent,
  RecipeImportFormState,
} from '@/components/organisms'

import { createSupabaseRecipeStore, importRecipe } from '@/libs/recipes'
import { createAdminClient } from '@/libs/supabase/admin'
import { isOwner } from '@/libs/supabase/owner'

const isIntent = (value: unknown): value is ImportIntent =>
  value === 'preview' || value === 'import' || value === 'overwrite'

// Checks who is asking before touching the service role client, which bypasses RLS
export const importRecipeAction = async (
  _previous: RecipeImportFormState,
  formData: FormData
): Promise<RecipeImportFormState> => {
  if (!(await isOwner())) {
    return { error: 'Only the site owner can import recipes.' }
  }

  const intent = formData.get('intent')
  if (!isIntent(intent)) return { error: 'Unknown action.' }

  const json = formData.get('json')
  if (typeof json !== 'string' || !json.trim()) {
    return { error: 'Paste a recipe as JSON first.' }
  }

  let input: unknown
  try {
    input = JSON.parse(json)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'parse error'
    return { error: `That is not valid JSON: ${reason}` }
  }

  try {
    const result = await importRecipe(
      createSupabaseRecipeStore(createAdminClient()),
      input,
      {
        // A preview of an existing slug shows what an overwrite would change
        dryRun: intent === 'preview',
        overwrite: intent !== 'import',
      }
    )
    return { intent, result }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'The import failed.',
    }
  }
}
