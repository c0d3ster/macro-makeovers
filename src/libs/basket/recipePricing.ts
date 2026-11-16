import type { BasketItemInput, RecipeImport } from '@/validations'

import type { BasketCatalog, BasketItem, BasketRecipe } from './basketTypes'

import { costPerServing, costTierFor, formatMoney } from './basketMath'

const TIER_SIGNS = ['$', '$$', '$$$', '$$$$', '$$$$$']

const tierSign = (tier: number): string => TIER_SIGNS[tier - 1] ?? String(tier)

export type BuildPrice = {
  build: string
  // Prorated by what the build uses, spices and pantry staples included
  perServing: number
  tier: number
  // The tier the recipe or build says it is
  statedTier: number
}

type PricingIssue = {
  path: string
  message: string
}

export type RecipePricing = {
  prices: BuildPrice[]
  warnings: PricingIssue[]
}

// A price item in save shape as the basket math reads it
export const toCatalogItem = ({
  key: _key,
  priceSource,
  sizes,
  isEstimate,
  ...item
}: BasketItemInput): BasketItem => ({
  ...item,
  ...(sizes?.length ? { sizes } : {}),
  ...(isEstimate ? { isEstimate } : {}),
  ...(priceSource ? { priceSource } : {}),
})

// The basket's view of a recipe in import shape: its lines and each build's changes
export const toBasketRecipe = (recipe: RecipeImport): BasketRecipe | undefined => {
  if (!recipe.basketLines) return undefined
  const builds = recipe.builds.flatMap(({ key, basketLines }) =>
    basketLines ? [[key, { lines: basketLines }] as const] : []
  )
  return {
    slug: recipe.slug,
    servings: recipe.servings,
    lines: recipe.basketLines,
    ...(builds.length > 0 ? { builds: Object.fromEntries(builds) } : {}),
  }
}

// What each build of a recipe costs per serving, prorated the way the recipe pages and the
// $ tiers are, and a warning where a listed build lands in a different tier than it says. The
// tier stays a judgment call, so a mismatch never blocks an import.
export const priceRecipe = (
  items: Record<string, BasketItem>,
  recipe: RecipeImport
): RecipePricing => {
  const basketRecipe = toBasketRecipe(recipe)
  if (!basketRecipe) return { prices: [], warnings: [] }
  const catalog: BasketCatalog = { items, recipes: [basketRecipe] }

  const prices = recipe.builds.map((build): BuildPrice => {
    const perServing = costPerServing(catalog, [
      {
        slug: recipe.slug,
        servings: recipe.servings,
        ...(build.basketLines ? { build: build.key } : {}),
      },
    ])
    return {
      build: build.key,
      perServing,
      tier: costTierFor(perServing),
      statedTier: build.costTier ?? recipe.costTier,
    }
  })

  const warnings = prices.flatMap(({ build, perServing, tier, statedTier }, index) => {
    if (tier === statedTier) return []
    const own = recipe.builds[index]?.costTier !== undefined
    // A part like "Filling only" never leads a card, so the recipe's tier is not a claim about it
    if (!own && recipe.builds[index]?.listed === false) return []
    return [
      {
        path: own ? `builds[${index}].costTier` : 'costTier',
        message: `The "${build}" build works out to ${formatMoney(perServing)} a serving, which is ${tierSign(tier)}, not ${tierSign(statedTier)}`,
      },
    ]
  })

  return { prices, warnings }
}
