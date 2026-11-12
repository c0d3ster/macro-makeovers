import type { SQL } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { and, asc, desc, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm'

import type { schemas } from '@/models'
import type { RecipeImport } from '@/validations'

import {
  ingredients,
  recipeBuilds,
  recipeNotes,
  recipeNutrition,
  recipeRevisions,
  recipes,
  recipeTags,
  steps,
  tags,
} from '@/models'

import type { RecipeCard } from './recipeCards'
import type { RecipeDetail } from './recipeDetail'
import type { IngredientMatch } from './recipeFilters'
import type { RecipeStatus } from './recipeStatus'

import { toRecipeCard } from './recipeCards'
import { toRecipeDetail } from './recipeDetail'
import { RecipeRuleError } from './recipeRuleError'

// Not exported from the recipes barrel on purpose: this pulls in the Drizzle models, which
// client components that import the barrel for pure helpers must not bundle. Import it by
// path in server code.

type Db = NodePgDatabase<typeof schemas>
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
type Reader = Db | Tx

// One row of the admin list: drafts and published recipes together
export type DeleteRecipeResult =
  | { status: 'deleted'; slug: string }
  | { status: 'not_found' }
  | { status: 'has_variants'; titles: string[] }

export type AdminRecipe = {
  id: string
  slug: string
  title: string
  status: RecipeStatus
  updatedAt: Date
}

const UNIQUE_VIOLATION = '23505'

// Drizzle wraps the driver error, so the Postgres code can be on the error or its cause
const isUniqueViolation = (error: unknown): boolean => {
  const { code, cause } = error as { code?: string; cause?: { code?: string } }
  return code === UNIQUE_VIOLATION || cause?.code === UNIQUE_VIOLATION
}

// Same as jsonb_strip_nulls on the old SQL snapshot: a missing value is left out, not null
const withoutNulls = <T extends Record<string, unknown>>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry != null)
  ) as T

// Empty lists are left out of the import shape, the same as a missing field
const nonEmpty = (values: string[]): string[] | undefined =>
  values.length > 0 ? values : undefined

const readScope = ({
  onlyBuilds,
  skipBuilds,
}: {
  onlyBuilds: string[]
  skipBuilds: string[]
}): { onlyBuilds?: string[]; skipBuilds?: string[] } => ({
  onlyBuilds: nonEmpty(onlyBuilds),
  skipBuilds: nonEmpty(skipBuilds),
})

const writeScope = ({
  onlyBuilds,
  skipBuilds,
}: {
  onlyBuilds?: string[]
  skipBuilds?: string[]
}): { onlyBuilds: string[]; skipBuilds: string[] } => ({
  onlyBuilds: onlyBuilds ?? [],
  skipBuilds: skipBuilds ?? [],
})

// Builds are matched by key instead of replaced, so a build keeps its id and its photo across
// edits. A build whose key is gone is deleted. Defaults are cleared first so the one-default
// index never sees two at once.
const upsertBuilds = async (
  tx: Tx,
  recipeId: string,
  builds: RecipeImport['builds']
): Promise<void> => {
  const keys = builds.map(({ key }) => key)
  await tx
    .delete(recipeBuilds)
    .where(
      and(
        eq(recipeBuilds.recipeId, recipeId),
        notInArray(recipeBuilds.key, keys)
      )
    )
  await tx
    .update(recipeBuilds)
    .set({ isDefault: false })
    .where(eq(recipeBuilds.recipeId, recipeId))

  // One at a time: inside a transaction every query shares one connection
  for (const [position, build] of builds.entries()) {
    const fields = {
      label: build.label,
      position,
      isDefault: build.isDefault,
      listed: build.listed,
      calories: build.calories,
      carbsG: build.carbsG,
      fatG: build.fatG,
      proteinG: build.proteinG,
      title: build.title ?? null,
      swap: build.swap ?? {},
      noteMd: build.note ?? null,
      costTier: build.costTier ?? null,
      difficulty: build.difficulty ?? null,
      prepMinutes: build.prepMinutes ?? null,
      cookMinutes: build.cookMinutes ?? null,
    }
    await tx
      .insert(recipeBuilds)
      .values({ recipeId, key: build.key, ...fields })
      .onConflictDoUpdate({
        target: [recipeBuilds.recipeId, recipeBuilds.key],
        set: fields,
      })
  }
}

// The recipe in import shape. Children come back in the order they were imported in, and
// tags sorted by name, so a re-import of unchanged JSON diffs clean.
const readSnapshot = async (
  reader: Reader,
  recipeId: string
): Promise<RecipeImport | null> => {
  const [recipe] = await reader
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1)
  if (!recipe) return null

  const [base] = recipe.variantOf
    ? await reader
        .select({ slug: recipes.slug })
        .from(recipes)
        .where(eq(recipes.id, recipe.variantOf))
        .limit(1)
    : []

  // One at a time: inside a transaction every query shares one connection
  const tagRows = await reader
    .select({ name: tags.name })
    .from(recipeTags)
    .innerJoin(tags, eq(tags.id, recipeTags.tagId))
    .where(eq(recipeTags.recipeId, recipeId))
  const buildRows = await reader
    .select()
    .from(recipeBuilds)
    .where(eq(recipeBuilds.recipeId, recipeId))
    .orderBy(asc(recipeBuilds.position))
  // Builds hold the makeover macros now. Makeover rows left from before builds are skipped.
  const nutritionRows = await reader
    .select()
    .from(recipeNutrition)
    .where(
      and(
        eq(recipeNutrition.recipeId, recipeId),
        eq(recipeNutrition.kind, 'traditional')
      )
    )
    .orderBy(asc(recipeNutrition.position))
  const ingredientRows = await reader
    .select()
    .from(ingredients)
    .where(eq(ingredients.recipeId, recipeId))
    .orderBy(asc(ingredients.position))
  const stepRows = await reader
    .select()
    .from(steps)
    .where(eq(steps.recipeId, recipeId))
    .orderBy(asc(steps.position))
  const noteRows = await reader
    .select()
    .from(recipeNotes)
    .where(eq(recipeNotes.recipeId, recipeId))
    .orderBy(asc(recipeNotes.position))

  return withoutNulls({
    slug: recipe.slug,
    title: recipe.title,
    summary: recipe.summary,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    costTier: recipe.costTier,
    variantOf: base?.slug,
    difficulty: recipe.difficulty,
    spiceLevel: recipe.spiceLevel,
    tags: tagRows.map(({ name }) => name).sort(),
    builds: buildRows.map((row) =>
      withoutNulls({
        key: row.key,
        label: row.label,
        isDefault: row.isDefault,
        listed: row.listed,
        calories: row.calories,
        carbsG: row.carbsG,
        fatG: row.fatG,
        proteinG: row.proteinG,
        swap: Object.keys(row.swap).length > 0 ? row.swap : undefined,
        title: row.title,
        note: row.noteMd,
        costTier: row.costTier,
        difficulty: row.difficulty,
        prepMinutes: row.prepMinutes,
        cookMinutes: row.cookMinutes,
      })
    ),
    nutrition: nutritionRows.map((row) => ({
      kind: row.kind,
      label: row.label,
      calories: row.calories,
      carbsG: row.carbsG,
      fatG: row.fatG,
      proteinG: row.proteinG,
    })),
    ingredients: ingredientRows.map((row) =>
      withoutNulls({
        group: row.groupName,
        raw: row.rawText,
        quantity: row.quantity,
        unit: row.unit,
        name: row.name,
        note: row.note,
        ...readScope(row),
      })
    ),
    steps: stepRows.map((row) =>
      withoutNulls({
        phase: row.phase,
        body: row.bodyMd,
        durationMinutes: row.durationMinutes,
        ...readScope(row),
      })
    ),
    notes: noteRows.map((row) =>
      withoutNulls({ kind: row.kind, body: row.bodyMd, ...readScope(row) })
    ),
  }) as RecipeImport
}

// The base a variant points at has to exist, be a base itself, and the recipe being written
// cannot already be someone's base. Variants are one level deep.
const resolveBaseId = async (
  tx: Reader,
  { slug, variantOf }: RecipeImport
): Promise<string | null> => {
  if (!variantOf) return null

  const [base] = await tx
    .select({ id: recipes.id, variantOf: recipes.variantOf })
    .from(recipes)
    .where(eq(recipes.slug, variantOf))
    .limit(1)
  if (!base) {
    throw new RecipeRuleError(
      'variantOf',
      `Base recipe "${variantOf}" does not exist. Import it first`
    )
  }
  if (base.variantOf) {
    throw new RecipeRuleError(
      'variantOf',
      `"${variantOf}" is itself a variant, and variants are one level deep`
    )
  }

  const [self] = await tx
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.slug, slug))
    .limit(1)
  if (self) {
    const [child] = await tx
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.variantOf, self.id))
      .limit(1)
    if (child) {
      throw new RecipeRuleError(
        'variantOf',
        `"${slug}" has variants, so it cannot become a variant itself`
      )
    }
  }

  return base.id
}

// Replaces everything hanging off a recipe with what the import says, except builds, which
// are upserted by key. Runs inside the
// create or update transaction, so the old rows only go if the new ones land.
const replaceChildren = async (
  tx: Tx,
  recipeId: string,
  recipe: RecipeImport
): Promise<void> => {
  await tx.delete(recipeNutrition).where(eq(recipeNutrition.recipeId, recipeId))
  await tx.delete(ingredients).where(eq(ingredients.recipeId, recipeId))
  await tx.delete(steps).where(eq(steps.recipeId, recipeId))
  await tx.delete(recipeNotes).where(eq(recipeNotes.recipeId, recipeId))
  await tx.delete(recipeTags).where(eq(recipeTags.recipeId, recipeId))

  await upsertBuilds(tx, recipeId, recipe.builds)

  // Position is the index in the import, so order survives the round trip
  if (recipe.nutrition.length > 0) {
    await tx.insert(recipeNutrition).values(
      recipe.nutrition.map((row, position) => ({
        recipeId,
        position,
        kind: row.kind,
        label: row.label,
        calories: row.calories,
        carbsG: row.carbsG,
        fatG: row.fatG,
        proteinG: row.proteinG,
      }))
    )
  }
  await tx.insert(ingredients).values(
    recipe.ingredients.map((row, position) => ({
      recipeId,
      position,
      groupName: row.group ?? null,
      rawText: row.raw,
      quantity: row.quantity ?? null,
      unit: row.unit ?? null,
      name: row.name ?? null,
      note: row.note ?? null,
      ...writeScope(row),
    }))
  )
  await tx.insert(steps).values(
    recipe.steps.map((row, position) => ({
      recipeId,
      position,
      phase: row.phase,
      bodyMd: row.body,
      durationMinutes: row.durationMinutes ?? null,
      ...writeScope(row),
    }))
  )
  if (recipe.notes.length > 0) {
    await tx.insert(recipeNotes).values(
      recipe.notes.map((row, position) => ({
        recipeId,
        position,
        kind: row.kind,
        bodyMd: row.body,
        ...writeScope(row),
      }))
    )
  }

  // Unknown tags are created as attribute tags
  const tagNames = [...new Set(recipe.tags)]
  if (tagNames.length > 0) {
    await tx
      .insert(tags)
      .values(tagNames.map((name) => ({ name, kind: 'attribute' as const })))
      .onConflictDoNothing({ target: tags.name })
    const tagRows = await tx
      .select({ id: tags.id })
      .from(tags)
      .where(inArray(tags.name, tagNames))
    await tx
      .insert(recipeTags)
      .values(tagRows.map(({ id }) => ({ recipeId, tagId: id })))
  }
}

const variantFields = (recipe: RecipeImport, variantOf: string | null) => ({
  title: recipe.title,
  summary: recipe.summary,
  servings: recipe.servings,
  prepMinutes: recipe.prepMinutes,
  cookMinutes: recipe.cookMinutes,
  costTier: recipe.costTier,
  difficulty: recipe.difficulty,
  spiceLevel: recipe.spiceLevel ?? null,
  variantOf,
})

// Recipes in Postgres through Drizzle. Each create or update runs in one transaction, so a
// failure anywhere leaves the recipe as it was, and writes a revision of the result. The
// connection is the database owner's and bypasses RLS, so only call this after checking
// who is asking.
export class RecipeRepository {
  // authId is the Supabase auth id of whoever is importing, recorded on the revision.
  // Leave it out for scripts, which write revisions with no author.
  constructor(
    private database: Db,
    private authId?: string
  ) {}

  getRecipeIdBySlug = async (slug: string): Promise<string | undefined> => {
    const [row] = await this.database
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.slug, slug))
      .limit(1)
    return row?.id
  }

  // The recipe in import shape. The caller validates it, since stored data can drift from
  // the schema.
  getRecipe = (id: string): Promise<unknown> => readSnapshot(this.database, id)

  // Throws RecipeRuleError when the recipe breaks a rule that needs the database to check,
  // such as variant links. Nothing is written. Create and update enforce the same rules.
  validateRecipe = async (recipe: RecipeImport): Promise<void> => {
    await resolveBaseId(this.database, recipe)
  }

  // A new recipe lands as a draft
  createRecipe = (recipe: RecipeImport): Promise<string> =>
    this.database
      .transaction(async (tx) => {
        const variantOf = await resolveBaseId(tx, recipe)
        const [row] = await tx
          .insert(recipes)
          .values({ slug: recipe.slug, ...variantFields(recipe, variantOf) })
          .returning({ id: recipes.id })
        if (!row) throw new Error(`Could not save "${recipe.slug}".`)

        await replaceChildren(tx, row.id, recipe)
        await this.writeRevision(tx, row.id)
        return row.id
      })
      .catch((error: unknown) => {
        // Two creates of one slug at once: the loser gets a normal issue, not a raw error
        if (isUniqueViolation(error)) {
          throw new RecipeRuleError(
            'slug',
            'A recipe with that slug already exists'
          )
        }
        throw error
      })

  // An existing recipe keeps its status and access, so re-importing a published recipe does
  // not take it offline
  updateRecipe = (id: string, recipe: RecipeImport): Promise<string> =>
    this.database.transaction(async (tx) => {
      const variantOf = await resolveBaseId(tx, recipe)
      const [row] = await tx
        .update(recipes)
        .set(variantFields(recipe, variantOf))
        .where(eq(recipes.id, id))
        .returning({ id: recipes.id })
      if (!row) throw new Error(`Recipe ${id} no longer exists.`)

      await replaceChildren(tx, row.id, recipe)
      await this.writeRevision(tx, row.id)
      return row.id
    })

  // Reads. Drizzle connects as the database owner and bypasses RLS, so what a public reader
  // may see is decided here: every method for the public says "published" in its query.
  // The admin methods further down see drafts, so the caller must check the owner first.

  // Published base recipes for the grid, A to Z. Variants are reached from their base recipe.
  listPublishedCards = async (): Promise<RecipeCard[]> => {
    const rows = await this.database.query.recipes.findMany({
      where: and(eq(recipes.status, 'published'), isNull(recipes.variantOf)),
      orderBy: asc(recipes.title),
      with: {
        builds: true,
        nutrition: true,
        recipeTags: { with: { tag: true } },
      },
    })

    return rows.flatMap((row) => {
      const card = toRecipeCard(row)
      return card ? [card] : []
    })
  }

  // One published recipe with everything the page needs, or undefined when the slug is
  // unknown, unpublished, or has no makeover build to lead with
  getPublishedDetail = (slug: string): Promise<RecipeDetail | undefined> =>
    this.findDetail(
      and(eq(recipes.slug, slug), eq(recipes.status, 'published'))
    )

  // The same page data for any recipe by id, drafts included, so the owner can preview a recipe
  // before publishing it. Related recipes are filtered as they are on the public page. Owner only.
  getDetailById = (id: string): Promise<RecipeDetail | undefined> =>
    this.findDetail(eq(recipes.id, id))

  private findDetail = async (
    where: SQL | undefined
  ): Promise<RecipeDetail | undefined> => {
    const row = await this.database.query.recipes.findFirst({
      where,
      with: {
        builds: true,
        nutrition: true,
        ingredients: true,
        steps: true,
        notes: true,
        recipeTags: { with: { tag: true } },
        base: { columns: { slug: true, title: true, status: true } },
        variants: {
          columns: { slug: true, title: true },
          where: (variant, { eq: equals }) =>
            equals(variant.status, 'published'),
          orderBy: (variant, { asc: ascending }) => ascending(variant.title),
        },
      },
    })
    if (!row) return undefined

    return toRecipeDetail(row, {
      // A draft base stays hidden from the public page
      baseRecipe:
        row.base?.status === 'published'
          ? { slug: row.base.slug, title: row.base.title }
          : undefined,
      variants: row.variants,
    })
  }

  // Every published slug, variants included, so each recipe page can be built ahead of time
  listPublishedSlugs = async (): Promise<string[]> => {
    const rows = await this.database
      .select({ slug: recipes.slug })
      .from(recipes)
      .where(eq(recipes.status, 'published'))
    return rows.map(({ slug }) => slug)
  }

  // Slugs of published recipes with an ingredient matching the search text. Uses the generated
  // tsvector on ingredients.raw_text, so "chicken thigh" also finds "chicken thighs".
  findPublishedIngredientMatches = async (text: string): Promise<IngredientMatch[]> => {
    const rows = await this.database
      .selectDistinct({
        slug: recipes.slug,
        onlyBuilds: ingredients.onlyBuilds,
        skipBuilds: ingredients.skipBuilds,
      })
      .from(ingredients)
      .innerJoin(recipes, eq(recipes.id, ingredients.recipeId))
      .where(
        and(
          eq(recipes.status, 'published'),
          sql`"ingredients"."search" @@ websearch_to_tsquery('english', ${text})`
        )
      )
    return rows.map(({ slug, onlyBuilds, skipBuilds }) => ({
      slug,
      ...(onlyBuilds.length > 0 ? { onlyBuilds } : {}),
      ...(skipBuilds.length > 0 ? { skipBuilds } : {}),
    }))
  }

  // Drafts and published recipes together, newest edit first. Owner only.
  listAdminRecipes = (): Promise<AdminRecipe[]> =>
    this.database
      .select({
        id: recipes.id,
        slug: recipes.slug,
        title: recipes.title,
        status: recipes.status,
        updatedAt: recipes.updatedAt,
      })
      .from(recipes)
      .orderBy(desc(recipes.updatedAt))

  // Publishes or unpublishes a recipe. Returns the recipe as the admin list shows it, or
  // undefined for an unknown id. Owner only.
  updateRecipeStatus = async (
    id: string,
    status: RecipeStatus
  ): Promise<AdminRecipe | undefined> => {
    const [row] = await this.database
      .update(recipes)
      .set({ status })
      .where(eq(recipes.id, id))
      .returning({
        id: recipes.id,
        slug: recipes.slug,
        title: recipes.title,
        status: recipes.status,
        updatedAt: recipes.updatedAt,
      })
    return row
  }

  // Deletes a recipe with its ingredients, steps, notes, nutrition, tags and revision history.
  // A base recipe that still has variants is left alone, because deleting it would orphan them.
  // Owner only.
  deleteRecipe = (id: string): Promise<DeleteRecipeResult> =>
    this.database.transaction(async (tx) => {
      const variants = await tx
        .select({ title: recipes.title })
        .from(recipes)
        .where(eq(recipes.variantOf, id))
        .orderBy(asc(recipes.title))
      if (variants.length > 0) {
        return { status: 'has_variants', titles: variants.map((v) => v.title) }
      }

      const [row] = await tx
        .delete(recipes)
        .where(eq(recipes.id, id))
        .returning({ slug: recipes.slug })
      return row
        ? { status: 'deleted', slug: row.slug }
        : { status: 'not_found' }
    })

  // Stores a generated placeholder photo, but only while the recipe has no photo at all, so a
  // real image is never replaced. Returns whether the row was written.
  setPlaceholderImage = async (id: string, url: string): Promise<boolean> => {
    const rows = await this.database
      .update(recipes)
      .set({ imageUrl: url, imageIsPlaceholder: true })
      .where(and(eq(recipes.id, id), isNull(recipes.imageUrl)))
      .returning({ id: recipes.id })
    return rows.length > 0
  }

  // A recipe's publish status, or undefined for an unknown id. Owner only.
  getRecipeStatus = async (id: string): Promise<RecipeStatus | undefined> => {
    const [row] = await this.database
      .select({ status: recipes.status })
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1)
    return row?.status
  }

  // When the recipe was last saved, so a reader can tell whether it changed since
  getRecipeUpdatedAt = async (id: string): Promise<Date | undefined> => {
    const [row] = await this.database
      .select({ updatedAt: recipes.updatedAt })
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1)
    return row?.updatedAt
  }

  getRecipeImageUrl = async (id: string): Promise<string | undefined> => {
    const [row] = await this.database
      .select({ imageUrl: recipes.imageUrl })
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1)
    return row?.imageUrl ?? undefined
  }

  // Sets the photo the owner picked in the editor, replacing any earlier one. Generated photos
  // count as placeholders. Returns the slug, or undefined for an unknown id.
  setRecipeImage = async (
    id: string,
    url: string
  ): Promise<string | undefined> => {
    const [row] = await this.database
      .update(recipes)
      .set({ imageUrl: url, imageIsPlaceholder: true })
      .where(eq(recipes.id, id))
      .returning({ slug: recipes.slug })
    return row?.slug
  }

  // Each build's own photo by key. Builds without one are left out, since they show the recipe's.
  getBuildImageUrls = async (id: string): Promise<Record<string, string>> => {
    const rows = await this.database
      .select({ key: recipeBuilds.key, imageUrl: recipeBuilds.imageUrl })
      .from(recipeBuilds)
      .where(eq(recipeBuilds.recipeId, id))
    return Object.fromEntries(
      rows.flatMap(({ key, imageUrl }) => (imageUrl ? [[key, imageUrl]] : []))
    )
  }

  // Sets or clears a build's own photo. Returns the recipe's slug, or undefined when the recipe
  // or the build is not saved.
  setBuildImage = async (
    id: string,
    key: string,
    url: string | null
  ): Promise<string | undefined> => {
    const [build] = await this.database
      .update(recipeBuilds)
      .set({ imageUrl: url, imageIsPlaceholder: url !== null })
      .where(and(eq(recipeBuilds.recipeId, id), eq(recipeBuilds.key, key)))
      .returning({ id: recipeBuilds.id })
    if (!build) return undefined

    const [recipe] = await this.database
      .select({ slug: recipes.slug })
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1)
    return recipe?.slug
  }

  // Each published recipe's photo by slug, for the book
  listPublishedImageUrls = async (): Promise<Map<string, string>> => {
    // The default build's own photo first, the same photo the recipe page leads with
    const rows = await this.database
      .select({
        slug: recipes.slug,
        imageUrl: sql<string | null>`coalesce(${recipeBuilds.imageUrl}, ${recipes.imageUrl})`,
      })
      .from(recipes)
      .leftJoin(
        recipeBuilds,
        and(eq(recipeBuilds.recipeId, recipes.id), eq(recipeBuilds.isDefault, true))
      )
      .where(eq(recipes.status, 'published'))
    const urls = new Map<string, string>()
    rows.forEach(({ slug, imageUrl }) => {
      if (imageUrl) urls.set(slug, imageUrl)
    })
    return urls
  }

  private writeRevision = async (tx: Tx, recipeId: string): Promise<void> => {
    await tx.insert(recipeRevisions).values({
      recipeId,
      snapshot: await readSnapshot(tx, recipeId),
      createdBy: this.authId ?? null,
    })
  }
}
