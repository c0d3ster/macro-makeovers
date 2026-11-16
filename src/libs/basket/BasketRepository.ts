import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { asc, eq, inArray, max, min } from 'drizzle-orm'

import type { schemas } from '@/models'
import type { BasketItemInput } from '@/validations'

import {
  basketItems,
  basketItemSizes,
  recipeBasketLines,
  recipeBuildBasketLines,
  recipeBuilds,
  recipeComponents,
  recipes,
} from '@/models'

import type { BasketCatalog, BasketItem, BasketRecipe } from './basketTypes'

// Not exported from the basket barrel on purpose: this pulls in the Drizzle models, which the
// client components that import the barrel for the pure math must not bundle. Import it by path
// in server code.

type Db = NodePgDatabase<typeof schemas>

type CatalogOptions = {
  // Drafts too, for pricing a recipe before it is published. Owner only.
  includeDrafts?: boolean
}

// An item as the price book stores it, for the admin and the connector
export type BasketItemRecord = BasketItemInput

type ItemRow = typeof basketItems.$inferSelect
type SizeRow = typeof basketItemSizes.$inferSelect

const toBasketItem = (row: ItemRow, sizes: SizeRow[]): BasketItem => ({
  name: row.name,
  pack: row.pack,
  packQuantity: row.packQuantity,
  unit: row.unit,
  price: row.price,
  section: row.section,
  pantry: row.pantry,
  perishable: row.perishable,
  ...(sizes.length > 0
    ? {
        sizes: sizes.map(({ pack, packQuantity, price }) => ({
          pack,
          packQuantity,
          price,
        })),
      }
    : {}),
  ...(row.isEstimate ? { isEstimate: true } : {}),
  pricedOn: row.pricedOn,
})

const toRecord = (row: ItemRow, sizes: SizeRow[]): BasketItemRecord => ({
  key: row.key,
  name: row.name,
  pack: row.pack,
  packQuantity: row.packQuantity,
  unit: row.unit,
  price: row.price,
  section: row.section,
  pantry: row.pantry,
  perishable: row.perishable,
  ...(row.priceSource ? { priceSource: row.priceSource } : {}),
  isEstimate: row.isEstimate,
  pricedOn: row.pricedOn,
  ...(sizes.length > 0
    ? {
        sizes: sizes.map(({ pack, packQuantity, price }) => ({
          pack,
          packQuantity,
          price,
        })),
      }
    : {}),
})

const groupBy = <T, K>(rows: T[], keyOf: (row: T) => K): Map<K, T[]> =>
  rows.reduce((groups, row) => {
    const key = keyOf(row)
    groups.set(key, [...(groups.get(key) ?? []), row])
    return groups
  }, new Map<K, T[]>())

const toLines = (
  rows: { itemKey: string; quantity: number }[]
): Record<string, number> =>
  Object.fromEntries(rows.map(({ itemKey, quantity }) => [itemKey, quantity]))

// The price book and every recipe's shopping lines, through Drizzle. The connection is the
// database owner's and bypasses RLS, so the public reads say "published" in their queries and
// the writes are only called after the owner check.
export class BasketRepository {
  constructor(private database: Db) {}

  // Every item with its sizes, smallest size first
  private readItems = async (): Promise<{
    items: ItemRow[]
    sizes: Map<string, SizeRow[]>
  }> => {
    const items = await this.database
      .select()
      .from(basketItems)
      .orderBy(asc(basketItems.key))
    const sizes = await this.database
      .select()
      .from(basketItemSizes)
      .orderBy(asc(basketItemSizes.itemKey), asc(basketItemSizes.packQuantity))
    return { items, sizes: groupBy(sizes, ({ itemKey }) => itemKey) }
  }

  // The price book as the basket math reads it, by key
  getItems = async (): Promise<Record<string, BasketItem>> => {
    const { items, sizes } = await this.readItems()
    return Object.fromEntries(
      items.map((row) => [row.key, toBasketItem(row, sizes.get(row.key) ?? [])])
    )
  }

  listItems = async (): Promise<BasketItemRecord[]> => {
    const { items, sizes } = await this.readItems()
    return items.map((row) => toRecord(row, sizes.get(row.key) ?? []))
  }

  // What the basket math prices from. A recipe with no lines is left out, so it has no
  // "Add to basket". A recipe another recipe links as a side or sauce is a component.
  getCatalog = async ({
    includeDrafts = false,
  }: CatalogOptions = {}): Promise<BasketCatalog> => {
    const { items, sizes } = await this.readItems()

    const shown = includeDrafts ? undefined : eq(recipes.status, 'published')
    const lineRows = await this.database
      .select({
        recipeId: recipeBasketLines.recipeId,
        slug: recipes.slug,
        servings: recipes.servings,
        itemKey: recipeBasketLines.itemKey,
        quantity: recipeBasketLines.quantity,
      })
      .from(recipeBasketLines)
      .innerJoin(recipes, eq(recipes.id, recipeBasketLines.recipeId))
      .where(shown)
      .orderBy(asc(recipes.slug), asc(recipeBasketLines.position))
    const byRecipe = groupBy(lineRows, ({ recipeId }) => recipeId)
    const recipeIds = [...byRecipe.keys()]

    const buildRows = recipeIds.length
      ? await this.database
          .select({
            recipeId: recipeBuilds.recipeId,
            key: recipeBuilds.key,
            itemKey: recipeBuildBasketLines.itemKey,
            quantity: recipeBuildBasketLines.quantity,
          })
          .from(recipeBuildBasketLines)
          .innerJoin(recipeBuilds, eq(recipeBuilds.id, recipeBuildBasketLines.buildId))
          .where(inArray(recipeBuilds.recipeId, recipeIds))
          .orderBy(asc(recipeBuilds.position), asc(recipeBuildBasketLines.position))
      : []
    const buildsByRecipe = groupBy(buildRows, ({ recipeId }) => recipeId)

    const componentRows = recipeIds.length
      ? await this.database
          .selectDistinct({ id: recipeComponents.componentId })
          .from(recipeComponents)
          .where(inArray(recipeComponents.componentId, recipeIds))
      : []
    const components = new Set(componentRows.map(({ id }) => id))

    const basketRecipes = [...byRecipe.entries()].flatMap(
      ([recipeId, rows]): BasketRecipe[] => {
        const [first] = rows
        if (!first) return []
        const builds = groupBy(buildsByRecipe.get(recipeId) ?? [], ({ key }) => key)
        return [
          {
            slug: first.slug,
            servings: first.servings,
            lines: toLines(rows),
            ...(components.has(recipeId) ? { component: true } : {}),
            ...(builds.size > 0
              ? {
                  builds: Object.fromEntries(
                    Array.from(builds.entries(), ([key, buildLines]) => [
                      key,
                      { lines: toLines(buildLines) },
                    ])
                  ),
                }
              : {}),
          },
        ]
      }
    )

    const [dates] = await this.database
      .select({ from: min(basketItems.pricedOn), through: max(basketItems.pricedOn) })
      .from(basketItems)

    return {
      items: Object.fromEntries(
        items.map((row) => [row.key, toBasketItem(row, sizes.get(row.key) ?? [])])
      ),
      recipes: basketRecipes,
      ...(dates?.from ? { pricedFrom: dates.from } : {}),
      ...(dates?.through ? { pricedThrough: dates.through } : {}),
    }
  }

  // Adds or replaces items by key, sizes included, in one transaction. Returns the saved keys.
  saveItems = (items: BasketItemInput[]): Promise<string[]> =>
    this.database.transaction(async (tx) => {
      // One at a time: inside a transaction every query shares one connection
      for (const item of items) {
        const fields = {
          name: item.name,
          pack: item.pack,
          packQuantity: item.packQuantity,
          unit: item.unit,
          price: item.price,
          section: item.section,
          pantry: item.pantry,
          perishable: item.perishable,
          priceSource: item.priceSource ?? null,
          isEstimate: item.isEstimate,
          pricedOn: item.pricedOn,
        }
        await tx
          .insert(basketItems)
          .values({ key: item.key, ...fields })
          .onConflictDoUpdate({ target: basketItems.key, set: fields })
        await tx.delete(basketItemSizes).where(eq(basketItemSizes.itemKey, item.key))
        if (item.sizes?.length) {
          await tx
            .insert(basketItemSizes)
            .values(item.sizes.map((size) => ({ itemKey: item.key, ...size })))
        }
      }
      return items.map(({ key }) => key)
    })

  // Replaces one recipe's lines and its builds' changes without touching the rest of the
  // recipe, for backfilling recipes saved before basket data lived with them. Builds are named
  // by key and have to exist. Returns false for an unknown slug.
  replaceRecipeLines = (
    slug: string,
    lines: Record<string, number>,
    buildLines: Record<string, Record<string, number>> = {}
  ): Promise<boolean> =>
    this.database.transaction(async (tx) => {
      const [recipe] = await tx
        .select({ id: recipes.id })
        .from(recipes)
        .where(eq(recipes.slug, slug))
        .limit(1)
      if (!recipe) return false

      const builds = await tx
        .select({ id: recipeBuilds.id, key: recipeBuilds.key })
        .from(recipeBuilds)
        .where(eq(recipeBuilds.recipeId, recipe.id))
      const buildIds = new Map(builds.map(({ key, id }) => [key, id]))
      const unknown = Object.keys(buildLines).find((key) => !buildIds.has(key))
      if (unknown) throw new Error(`"${slug}" has no build with the key "${unknown}"`)

      await tx.delete(recipeBasketLines).where(eq(recipeBasketLines.recipeId, recipe.id))
      if (builds.length > 0) {
        await tx.delete(recipeBuildBasketLines).where(
          inArray(
            recipeBuildBasketLines.buildId,
            builds.map(({ id }) => id)
          )
        )
      }

      const rows = Object.entries(lines).map(([itemKey, quantity], position) => ({
        recipeId: recipe.id,
        itemKey,
        quantity,
        position,
      }))
      if (rows.length > 0) await tx.insert(recipeBasketLines).values(rows)

      const buildRows = Object.entries(buildLines).flatMap(([key, changes]) =>
        Object.entries(changes).map(([itemKey, quantity], position) => ({
          buildId: buildIds.get(key) ?? '',
          itemKey,
          quantity,
          position,
        }))
      )
      if (buildRows.length > 0) await tx.insert(recipeBuildBasketLines).values(buildRows)
      return true
    })

  // Slugs of recipes that buy any of these items, drafts included, for refreshing their pages
  listSlugsUsingItems = async (keys: string[]): Promise<string[]> => {
    if (keys.length === 0) return []
    const direct = await this.database
      .selectDistinct({ slug: recipes.slug })
      .from(recipeBasketLines)
      .innerJoin(recipes, eq(recipes.id, recipeBasketLines.recipeId))
      .where(inArray(recipeBasketLines.itemKey, keys))
    const viaBuilds = await this.database
      .selectDistinct({ slug: recipes.slug })
      .from(recipeBuildBasketLines)
      .innerJoin(recipeBuilds, eq(recipeBuilds.id, recipeBuildBasketLines.buildId))
      .innerJoin(recipes, eq(recipes.id, recipeBuilds.recipeId))
      .where(inArray(recipeBuildBasketLines.itemKey, keys))
    return [...new Set([...direct, ...viaBuilds].map(({ slug }) => slug))].sort()
  }
}
