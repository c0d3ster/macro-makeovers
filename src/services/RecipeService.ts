import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import type { ImportRecipeResult } from '@/graphql/schema'
import type { ImportResult } from '@/libs/recipes'
import type { schemas } from '@/models'

import { ImportRecipeStatus } from '@/graphql/schema'
import { db } from '@/libs/DB'
import { importRecipe } from '@/libs/recipes'
import { createDrizzleRecipeStore } from '@/libs/recipes/drizzleRecipeStore'

type ImportOptions = {
  overwrite: boolean
  dryRun: boolean
  // Supabase auth id of the importer, recorded on the revision
  authId?: string | undefined
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

// Authorization happens in the resolver. This writes over the database owner's connection,
// which bypasses RLS, so never call it without checking who is asking first.
export class RecipeService {
  constructor(private database: NodePgDatabase<typeof schemas> = db) {}

  async importRecipe(
    input: unknown,
    { overwrite, dryRun, authId }: ImportOptions
  ): Promise<ImportRecipeResult> {
    const store = createDrizzleRecipeStore(this.database, { authId })
    const result = await importRecipe(store, input, { overwrite, dryRun })

    return toImportRecipeResult(result)
  }
}
