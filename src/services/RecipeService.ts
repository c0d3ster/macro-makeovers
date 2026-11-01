import type { SupabaseClient } from '@supabase/supabase-js'

import type { ImportRecipeResult } from '@/graphql/schema'
import type { ImportResult } from '@/libs/recipes'
import type { Database } from '@/libs/supabase/database.types'

import { ImportRecipeStatus } from '@/graphql/schema'
import { createSupabaseRecipeStore, importRecipe } from '@/libs/recipes'
import { createAdminClient } from '@/libs/supabase/admin'

type ImportOptions = {
  overwrite: boolean
  dryRun: boolean
}

const STATUS_BY_RESULT: Record<ImportResult['status'], ImportRecipeStatus> = {
  invalid: ImportRecipeStatus.Invalid,
  created: ImportRecipeStatus.Created,
  updated: ImportRecipeStatus.Updated,
  unchanged: ImportRecipeStatus.Unchanged,
  conflict: ImportRecipeStatus.Conflict,
}

// Flattens the library's union into one GraphQL object. Both lists are always present, so a
// client never has to null-check them.
export const toImportRecipeResult = (
  result: ImportResult
): ImportRecipeResult => {
  const status = STATUS_BY_RESULT[result.status]

  if (result.status === 'invalid') {
    return { status, issues: result.issues, changes: [] }
  }

  return {
    status,
    slug: result.slug,
    ...('id' in result && result.id ? { id: result.id } : {}),
    issues: [],
    changes: 'changes' in result ? result.changes : [],
  }
}

// Authorization happens in the resolver. This writes with the service role client, which
// bypasses RLS, so never call it without checking who is asking first.
export class RecipeService {
  constructor(
    private createClient: () => SupabaseClient<Database> = createAdminClient
  ) {}

  async importRecipe(
    input: unknown,
    { overwrite, dryRun }: ImportOptions
  ): Promise<ImportRecipeResult> {
    const store = createSupabaseRecipeStore(this.createClient())
    const result = await importRecipe(store, input, { overwrite, dryRun })

    return toImportRecipeResult(result)
  }
}
