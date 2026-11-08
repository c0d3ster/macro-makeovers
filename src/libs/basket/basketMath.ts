import type {
  BasketEntry,
  BasketItem,
  BasketRecipe,
  StoreSection,
} from './basketTypes'

import { BASKET_ITEMS, BASKET_RECIPES } from './basketData'

type BasketOptions = {
  // Count pantry staples (oil, spices, flour) in the trip
  includePantry: boolean
}

type ItemUse = {
  slug: string
  quantity: number
}

// One line of the shopping list: an item, how much the recipes need, and what to buy
export type BasketLine = {
  key: string
  item: BasketItem
  // What the recipes need, in the item's unit
  quantity: number
  // Packs to buy. Fractional for items priced by weight.
  packs: number
  // What the packs cost at the register
  cost: number
  // The share of that cost the recipes use
  proratedCost: number
  // Bought but not used, in the item's unit. Zero for items priced by weight.
  leftoverQuantity: number
  usedBy: ItemUse[]
}

export type BasketTotals = {
  lines: BasketLine[]
  servings: number
  // Whole packs at the register: what the receipt shows
  tripCost: number
  // What the recipes use. This is how recipe pages price a serving.
  proratedCost: number
  leftoverCost: number
  // The part of the leftovers likely to spoil before it is used
  perishableLeftoverCost: number
}

export const BASKET_SLUGS = new Set(BASKET_RECIPES.map(({ slug }) => slug))

const RECIPES_BY_SLUG = new Map(
  BASKET_RECIPES.map((recipe) => [recipe.slug, recipe])
)

export const findBasketRecipe = (slug: string): BasketRecipe | undefined =>
  RECIPES_BY_SLUG.get(slug)

const isPricedByWeight = ({ pack }: BasketItem): boolean => pack === 'per lb'

// Whole packs, rounded up, except items priced by weight. The rounding step drops float noise
// so 2.0000001 packs stays 2.
const packsFor = (item: BasketItem, quantity: number): number => {
  const exact = quantity / item.packQuantity
  if (isPricedByWeight(item)) return exact
  return Math.ceil(Math.round(exact * 1e6) / 1e6)
}

const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0)

// Pools every entry's ingredients, then rounds each item up to whole packs once. Buying recipes
// together costs less than buying each alone because the rounding happens once per item.
export const computeBasket = (
  entries: BasketEntry[],
  { includePantry }: BasketOptions
): BasketTotals => {
  const pooled = new Map<string, ItemUse[]>()
  let servings = 0

  entries.forEach(({ slug, batches }) => {
    const recipe = findBasketRecipe(slug)
    if (!recipe) return
    servings += recipe.servings * batches
    Object.entries(recipe.lines).forEach(([key, quantity]) => {
      const item = BASKET_ITEMS[key]
      if (!item || (item.pantry && !includePantry)) return
      pooled.set(key, [
        ...(pooled.get(key) ?? []),
        { slug, quantity: quantity * batches },
      ])
    })
  })

  const lines = [...pooled.entries()].flatMap(([key, usedBy]) => {
    const item = BASKET_ITEMS[key]
    if (!item) return []
    const quantity = sum(usedBy.map((use) => use.quantity))
    const packs = packsFor(item, quantity)
    return [
      {
        key,
        item,
        quantity,
        packs,
        cost: packs * item.price,
        proratedCost: (quantity / item.packQuantity) * item.price,
        leftoverQuantity: isPricedByWeight(item)
          ? 0
          : packs * item.packQuantity - quantity,
        usedBy,
      },
    ]
  })

  const tripCost = sum(lines.map(({ cost }) => cost))
  const proratedCost = sum(lines.map((line) => line.proratedCost))

  return {
    lines,
    servings,
    tripCost,
    proratedCost,
    leftoverCost: tripCost - proratedCost,
    perishableLeftoverCost: sum(
      lines
        .filter(({ item }) => item.perishable)
        .map(({ cost, proratedCost: used }) => cost - used)
    ),
  }
}

// Cost per serving the way recipe pages show it: prorated, pantry included, so the basket and
// the recipe cards agree whatever the pantry toggle says
export const costPerServing = (entries: BasketEntry[]): number => {
  const { proratedCost, servings } = computeBasket(entries, {
    includePantry: true,
  })
  return servings > 0 ? proratedCost / servings : 0
}

// What buying each entry on its own trip would cost, minus the pooled trip
export const bundleSavings = (
  entries: BasketEntry[],
  options: BasketOptions
): number => {
  const separately = sum(
    entries.map((entry) => computeBasket([entry], options).tripCost)
  )
  return separately - computeBasket(entries, options).tripCost
}

export type BasketSuggestion = {
  slug: string
  // How much less the trip costs than buying the added recipe on its own
  saving: number
}

// The recipe that saves the most when added to this basket, if any saves at least a few cents
export const suggestAddition = (
  entries: BasketEntry[],
  options: BasketOptions
): BasketSuggestion | undefined => {
  const inBasket = new Set(entries.map(({ slug }) => slug))
  const current = computeBasket(entries, options).tripCost

  return BASKET_RECIPES.filter(({ slug }) => !inBasket.has(slug))
    .map(({ slug }) => {
      const added = { slug, batches: 1 }
      const alone = computeBasket([added], options).tripCost
      const together = computeBasket([...entries, added], options).tripCost
      return { slug, saving: current + alone - together }
    })
    .filter(({ saving }) => saving >= 0.05)
    .sort((a, b) => b.saving - a.saving)[0]
}

export type RankedBundle = {
  slugs: string[]
  saving: number
}

const combinations = (slugs: string[], size: number): string[][] => {
  if (size === 0) return [[]]
  return slugs.flatMap((slug, index) =>
    combinations(slugs.slice(index + 1), size - 1).map((rest) => [
      slug,
      ...rest,
    ])
  )
}

// Every group of `size` recipes, ranked by what pooling saves. Only the given slugs count, so
// the home page can limit it to published recipes.
export const rankBundles = (
  slugs: string[],
  size: number,
  options: BasketOptions
): RankedBundle[] =>
  combinations(
    slugs.filter((slug) => BASKET_SLUGS.has(slug)),
    size
  )
    .map((group) => ({
      slugs: group,
      saving: bundleSavings(
        group.map((slug) => ({ slug, batches: 1 })),
        options
      ),
    }))
    .sort((a, b) => b.saving - a.saving)

export const SECTION_ORDER: StoreSection[] = [
  'produce',
  'meat',
  'dairy',
  'bakery',
  'frozen',
  'pantry',
  'spices',
]

export const SECTION_LABELS: Record<StoreSection, string> = {
  produce: 'Produce',
  meat: 'Meat and seafood',
  dairy: 'Dairy and refrigerated',
  bakery: 'Bakery',
  frozen: 'Frozen',
  pantry: 'Pantry',
  spices: 'Spices and seasonings',
}

export type BasketSection = {
  section: StoreSection
  lines: BasketLine[]
}

// The list grouped by store section in walking order, A to Z within a section
export const groupBySection = (lines: BasketLine[]): BasketSection[] =>
  SECTION_ORDER.map((section) => ({
    section,
    lines: lines
      .filter(({ item }) => item.section === section)
      .sort((a, b) => a.item.name.localeCompare(b.item.name)),
  })).filter(({ lines: sectionLines }) => sectionLines.length > 0)

const roundQuantity = (value: number): string =>
  String(Math.round(value * 100) / 100)

// What to grab, like "2 × 16 oz tub", "1.5 lb", or just "3" for items sold one at a time
export const describePurchase = ({
  item,
  packs,
  quantity,
}: BasketLine): string => {
  if (isPricedByWeight(item)) return `${roundQuantity(quantity)} lb`
  if (item.pack.startsWith('each')) return String(packs)
  return `${packs} × ${item.pack}`
}

export const formatMoney = (value: number): string => `$${value.toFixed(2)}`

// The list as plain text for copying into notes or a message
export const toShoppingListText = (
  lines: BasketLine[],
  checked: Set<string> = new Set()
): string =>
  groupBySection(lines)
    .map(({ section, lines: sectionLines }) =>
      [
        SECTION_LABELS[section],
        ...sectionLines
          .filter(({ key }) => !checked.has(key))
          .map((line) => `- ${line.item.name}: ${describePurchase(line)}`),
      ].join('\n')
    )
    .join('\n\n')
