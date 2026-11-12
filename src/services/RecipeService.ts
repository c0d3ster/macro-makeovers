import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { revalidatePath } from 'next/cache'

import type { ImportRecipeResult } from '@/graphql/schema'
import type {
  ImportResult,
  IngredientMatch,
  RecipeCard,
  RecipeDetail,
  RecipeStatus,
} from '@/libs/recipes'
import type {
  AdminRecipe,
  DeleteRecipeResult,
} from '@/libs/recipes/RecipeRepository'
import type { schemas } from '@/models'

import { ImportRecipeStatus } from '@/graphql/schema'
import { triggerBookRebuild } from '@/libs/bookRebuild'
import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { importRecipe } from '@/libs/recipes'
import { RecipeRepository } from '@/libs/recipes/RecipeRepository'
import { revalidateRecipePages } from '@/libs/recipes/revalidateRecipePages'
import { recipeImportSchema } from '@/validations'

type ImportOptions = {
  overwrite: boolean
  dryRun: boolean
  // Supabase auth id of the importer, recorded on the revision
  authId?: string | undefined
  // Set when editing: the slug must belong to this recipe
  recipeId?: string | undefined
}

// Long enough for any real search, short enough that nobody sends a novel to Postgres
const MAX_SEARCH_LENGTH = 200

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type RecipePreview = {
  status: RecipeStatus
  recipe: RecipeDetail
}

type RecipeForImport = {
  id: string
  slug: string
  status: RecipeStatus
  updatedAt: Date
  recipe: unknown
}

type EditableRecipe = {
  id: string
  status: RecipeStatus
  imageUrl?: string
  // Each build's own photo by key
  buildImages: Record<string, string>
  recipe: unknown
}

// Public pages and the admin list cache recipes, so a write refreshes them, along with the pages
// of dishes that show this recipe inline as a side or sauce. A failure here must not turn a saved
// recipe into an error.
const refreshPages = async (
  repository: RecipeRepository,
  slug: string
): Promise<void> => {
  try {
    revalidateRecipePages(slug)
    const parents = await repository.listParentSlugs(slug)
    parents.forEach((parent) => revalidatePath(`/recipes/${parent}`))
    revalidatePath('/admin')
    // The editor shows the title and status too
    revalidatePath('/admin/recipes/[id]/edit', 'page')
  } catch (error) {
    logger.warn('Could not refresh recipe pages after an import', {
      slug,
      error: String(error),
    })
  }
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
const toImportRecipeResult = (result: ImportResult): ImportRecipeResult => {
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
    { overwrite, dryRun, authId, recipeId }: ImportOptions
  ): Promise<ImportRecipeResult> {
    const repository = new RecipeRepository(this.database, authId)
    const result = await importRecipe(repository, input, {
      overwrite,
      dryRun,
      ...(recipeId ? { recipeId } : {}),
    })

    if (
      !dryRun &&
      (result.status === 'created' || result.status === 'updated')
    ) {
      await refreshPages(repository, result.slug)
    }

    // A new recipe lands as a draft, so only edits to an existing one can change the book
    if (!dryRun && result.status === 'updated' && result.id) {
      await this.rebuildBookIfPublished(result.id)
    }

    return toImportRecipeResult(result)
  }

  private reader(): RecipeRepository {
    return new RecipeRepository(this.database)
  }

  // Asks for a book rebuild when the recipe is published. Never throws: the write it follows
  // has already succeeded.
  private async rebuildBookIfPublished(id: string): Promise<void> {
    try {
      const status = await this.reader().getRecipeStatus(id)
      if (status === 'published') await triggerBookRebuild()
    } catch (error) {
      logger.warn('Could not request a book rebuild', {
        id,
        error: String(error),
      })
    }
  }

  // Public reads. They only ever return published recipes, so they need no caller check.

  getRecipeCards(): Promise<RecipeCard[]> {
    return this.reader().listPublishedCards()
  }

  getRecipe(slug: string): Promise<RecipeDetail | undefined> {
    return this.reader().getPublishedDetail(slug)
  }

  getRecipeSlugs(): Promise<string[]> {
    return this.reader().listPublishedSlugs()
  }

  async getIngredientMatches(search: string): Promise<IngredientMatch[]> {
    const text = search.trim().slice(0, MAX_SEARCH_LENGTH)
    if (!text) return []
    return this.reader().findPublishedIngredientMatches(text)
  }

  // Owner reads. They include drafts, so the caller (the admin loaders) checks the owner first.

  getAdminRecipes(): Promise<AdminRecipe[]> {
    return this.reader().listAdminRecipes()
  }

  // Publishes or unpublishes a recipe and refreshes the pages it appears on. Returns undefined
  // for an unknown id. The resolver checks the owner first.
  async setRecipeStatus(
    id: string,
    status: RecipeStatus
  ): Promise<AdminRecipe | undefined> {
    if (!UUID.test(id)) return undefined

    const before = await this.reader().getRecipeStatus(id)
    const recipe = await this.reader().updateRecipeStatus(id, status)
    if (recipe) await refreshPages(this.reader(), recipe.slug)
    // Publishing and unpublishing both change the book. Saving a draft as a draft does not.
    if (recipe && (before === 'published' || status === 'published')) {
      await triggerBookRebuild()
    }
    return recipe
  }

  // Deletes a recipe and refreshes the pages it appeared on. Refuses while it has variants.
  // The caller checks the owner first.
  async deleteRecipe(id: string): Promise<DeleteRecipeResult> {
    if (!UUID.test(id)) return { status: 'not_found' }

    const before = await this.reader().getRecipeStatus(id)
    const result = await this.reader().deleteRecipe(id)
    if (result.status === 'deleted') {
      await refreshPages(this.reader(), result.slug)
      if (before === 'published') await triggerBookRebuild()
    }
    return result
  }

  // A recipe as its page would show it, drafts included, with its publish status. Undefined for
  // an unknown id or a recipe the page cannot show. The caller checks the owner first.
  async getRecipePreview(id: string): Promise<RecipePreview | undefined> {
    if (!UUID.test(id)) return undefined

    const repository = this.reader()
    const [status, recipe] = await Promise.all([
      repository.getRecipeStatus(id),
      repository.getDetailById(id),
    ])
    return status && recipe ? { status, recipe } : undefined
  }

  // Makes a generated photo the recipe's photo, and refreshes everywhere that shows it. False
  // when the id is unknown.
  // Sets a build's own photo, or clears it with null so the build shows the recipe photo.
  // False when the recipe or the build is not saved yet.
  async setBuildPhoto(
    id: string,
    key: string,
    url: string | null
  ): Promise<boolean> {
    if (!UUID.test(id)) return false

    const slug = await this.reader().setBuildImage(id, key, url)
    if (!slug) return false

    await refreshPages(this.reader(), slug)
    return true
  }

  async setRecipePhoto(id: string, url: string): Promise<boolean> {
    if (!UUID.test(id)) return false

    const slug = await this.reader().setRecipeImage(id, url)
    if (!slug) return false

    await refreshPages(this.reader(), slug)
    await this.rebuildBookIfPublished(id)
    return true
  }

  // The stored recipe in import shape by slug, with when it was last saved, for tools that edit
  // a recipe and import it back. Undefined for an unknown slug. The caller checks the owner first.
  async getRecipeForImport(slug: string): Promise<RecipeForImport | undefined> {
    const repository = this.reader()
    const id = await repository.getRecipeIdBySlug(slug)
    if (!id) return undefined

    const [editable, updatedAt] = await Promise.all([
      this.getEditableRecipe(id),
      repository.getRecipeUpdatedAt(id),
    ])
    if (!editable || !updatedAt) return undefined

    return {
      id,
      slug,
      status: editable.status,
      updatedAt,
      recipe: editable.recipe,
    }
  }

  // The stored recipe in import shape for the editor, or undefined when the id is unknown or
  // the stored data no longer matches the import schema
  async getEditableRecipe(id: string): Promise<EditableRecipe | undefined> {
    if (!UUID.test(id)) return undefined

    const repository = this.reader()
    const [status, snapshot, imageUrl, buildImages] = await Promise.all([
      repository.getRecipeStatus(id),
      repository.getRecipe(id),
      repository.getRecipeImageUrl(id),
      repository.getBuildImageUrls(id),
    ])
    if (!status) return undefined

    const parsed = recipeImportSchema.safeParse(snapshot)
    if (!parsed.success) {
      logger.error('Stored recipe does not match the import schema', {
        id,
        error: parsed.error.message,
      })
      return undefined
    }

    return { id, status, imageUrl, buildImages, recipe: parsed.data }
  }
}
