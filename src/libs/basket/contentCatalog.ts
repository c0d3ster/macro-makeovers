import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { BasketItemInput, RecipeImport } from '@/validations'

import { basketItemsSchema, recipeImportSchema } from '@/validations'

import type { BasketCatalog } from './basketTypes'

import { toBasketRecipe, toCatalogItem } from './recipePricing'

// The seed basket data in content/: the price book in content/basket/items.json and each seed
// recipe's basketLines. Tests price from it, and scripts/backfillBasket.ts writes it to a
// database. Node only: not exported from the basket barrel.

type ContentPaths = {
  items?: string
  recipes?: string
}

const DEFAULT_ITEMS = 'content/basket/items.json'
const DEFAULT_RECIPES = 'content/recipes'

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'))

export const readContentItems = (path = DEFAULT_ITEMS): BasketItemInput[] =>
  basketItemsSchema.parse(readJson(resolve(process.cwd(), path)))

export const readContentRecipes = (directory = DEFAULT_RECIPES): RecipeImport[] => {
  const folder = resolve(process.cwd(), directory)
  return readdirSync(folder)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => recipeImportSchema.parse(readJson(join(folder, name))))
}

// The catalog the database would hold after importing content/, every recipe treated as
// published. A recipe another seed links as a side or sauce is a component.
export const readContentCatalog = ({
  items: itemsPath,
  recipes: recipesPath,
}: ContentPaths = {}): BasketCatalog => {
  const items = readContentItems(itemsPath)
  const recipes = readContentRecipes(recipesPath)
  const components = new Set(
    recipes.flatMap(({ components: links }) => links.map(({ slug }) => slug))
  )
  const dates = items.map(({ pricedOn }) => pricedOn).sort()

  return {
    items: Object.fromEntries(items.map((item) => [item.key, toCatalogItem(item)])),
    recipes: recipes.flatMap((recipe) => {
      const basket = toBasketRecipe(recipe)
      if (!basket) return []
      return [{ ...basket, ...(components.has(recipe.slug) ? { component: true } : {}) }]
    }),
    ...(dates[0] ? { pricedFrom: dates[0] } : {}),
    ...(dates.at(-1) ? { pricedThrough: dates.at(-1) } : {}),
  }
}
