import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { asc, eq, inArray } from 'drizzle-orm'

import type { RecipeImport } from '@/validations'

import {
  ingredients,
  recipeNotes,
  recipeNutrition,
  recipeRevisions,
  recipes,
  recipeTags,
  schemas,
  steps,
  tags,
} from '@/models'

import { RecipeRuleError } from './recipeRuleError'

// Not exported from the recipes barrel on purpose: this pulls in the Drizzle models, which
// client components that import the barrel for pure helpers must not bundle. Import it by
// path in server code.

type Db = NodePgDatabase<typeof schemas>
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
type Reader = Db | Tx

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
  const nutritionRows = await reader
    .select()
    .from(recipeNutrition)
    .where(eq(recipeNutrition.recipeId, recipeId))
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
    tags: tagRows.map(({ name }) => name).sort(),
    nutrition: nutritionRows.map((row) => ({
      kind: row.kind,
      label: row.label,
      isDefault: row.isDefault,
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
      })
    ),
    steps: stepRows.map((row) =>
      withoutNulls({
        phase: row.phase,
        body: row.bodyMd,
        durationMinutes: row.durationMinutes,
      })
    ),
    notes: noteRows.map((row) => ({ kind: row.kind, body: row.bodyMd })),
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


// Replaces everything hanging off a recipe with what the import says. Runs inside the
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

  // Position is the index in the import, so order survives the round trip
  await tx.insert(recipeNutrition).values(
    recipe.nutrition.map((row, position) => ({
      recipeId,
      position,
      kind: row.kind,
      label: row.label,
      isDefault: row.isDefault,
      calories: row.calories,
      carbsG: row.carbsG,
      fatG: row.fatG,
      proteinG: row.proteinG,
    }))
  )
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
    }))
  )
  await tx.insert(steps).values(
    recipe.steps.map((row, position) => ({
      recipeId,
      position,
      phase: row.phase,
      bodyMd: row.body,
      durationMinutes: row.durationMinutes ?? null,
    }))
  )
  if (recipe.notes.length > 0) {
    await tx.insert(recipeNotes).values(
      recipe.notes.map((row, position) => ({
        recipeId,
        position,
        kind: row.kind,
        bodyMd: row.body,
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

  private writeRevision = async (tx: Tx, recipeId: string): Promise<void> => {
    await tx.insert(recipeRevisions).values({
      recipeId,
      snapshot: await readSnapshot(tx, recipeId),
      createdBy: this.authId ?? null,
    })
  }
}
