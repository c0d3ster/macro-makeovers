import type {
  BasketEntry,
  BasketItem,
  BasketRecipe,
  PackSize,
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
  // The packs by size, largest first, for items that come in more than one
  purchases: { size: PackSize; count: number }[]
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

// Dishes only: sides and sauces ride along inside the dishes that use them
const BUNDLE_SLUGS = new Set(
  BASKET_RECIPES.filter(({ component }) => !component).map(({ slug }) => slug)
)

const RECIPES_BY_SLUG = new Map(
  BASKET_RECIPES.map((recipe) => [recipe.slug, recipe])
)

export const findBasketRecipe = (slug: string): BasketRecipe | undefined =>
  RECIPES_BY_SLUG.get(slug)

// A recipe at the servings it is written for
// What one batch of a recipe uses for a build: the recipe's lines with the build's changes
const linesFor = (
  recipe: BasketRecipe,
  build?: string
): Record<string, number> => {
  const changes = build ? recipe.builds?.[build]?.lines : undefined
  if (!changes) return recipe.lines
  return Object.fromEntries(
    Object.entries({ ...recipe.lines, ...changes }).filter(([, quantity]) => quantity > 0)
  )
}

export const recipeEntry = (slug: string): BasketEntry => ({
  slug,
  servings: findBasketRecipe(slug)?.servings ?? 1,
})

const isPricedByWeight = ({ pack }: BasketItem): boolean => pack === 'per lb'

// The rounding step drops float noise so 2.0000001 packs stays 2
const packsOf = (quantity: number, size: PackSize): number =>
  Math.ceil(Math.round((quantity / size.packQuantity) * 1e6) / 1e6)

// Every size an item is sold in, smallest first
const sizesOf = (item: BasketItem): PackSize[] =>
  [
    { pack: item.pack, packQuantity: item.packQuantity, price: item.price },
    ...(item.sizes ?? []),
  ].sort((a, b) => a.packQuantity - b.packQuantity)

const unitPrice = ({ price, packQuantity }: PackSize): number =>
  price / packQuantity

const BIGGER_PACK_MARGIN = 1.1

// What one recipe's use costs: its share of the smallest size that covers it, so a recipe
// using 4 oz of cheese is priced from the 8 oz block, not the 16 oz one. A smaller size only
// counts when every bigger one costs more than 10% more. A use bigger than every
// size is priced at the best unit price, since it takes several packs anyway.
const proratedFor = (item: BasketItem, quantity: number): number => {
  // A bigger size that costs at most 10% more wins: a few cents more for a lot more is the
  // better buy, and a smaller size priced near the bigger one only inflates the per-ounce cost
  const sizes = sizesOf(item).filter(
    (size, index, all) =>
      !all
        .slice(index + 1)
        .some((bigger) => bigger.price <= size.price * BIGGER_PACK_MARGIN)
  )
  const fits = sizes.find(({ packQuantity }) => packQuantity >= quantity - 1e-9)
  const size =
    fits ??
    [...sizes].sort((a, b) => unitPrice(a) - unitPrice(b))[0] ??
    sizes[0]
  return size ? (quantity / size.packQuantity) * size.price : 0
}

type Purchase = { cost: number; purchases: { size: PackSize; count: number }[] }

// The cheapest mix of sizes that covers the quantity, fewer packs on a tie. Items come in one to
// three sizes, so trying every count of each larger size is quick.
const cheapestPurchase = (sizes: PackSize[], quantity: number): Purchase => {
  const [smallest, ...larger] = sizes
  if (!smallest) return { cost: 0, purchases: [] }
  if (larger.length === 0) {
    const count = packsOf(quantity, smallest)
    return {
      cost: count * smallest.price,
      purchases: count > 0 ? [{ size: smallest, count }] : [],
    }
  }
  const largest = larger.at(-1)
  const rest = [smallest, ...larger.slice(0, -1)]
  if (!largest) return cheapestPurchase(rest, quantity)

  const options = Array.from(
    { length: packsOf(quantity, largest) + 1 },
    (_, count): Purchase => {
      const remainder = Math.max(0, quantity - count * largest.packQuantity)
      const others = cheapestPurchase(rest, remainder)
      return {
        cost: count * largest.price + others.cost,
        purchases: [
          ...(count > 0 ? [{ size: largest, count }] : []),
          ...others.purchases,
        ],
      }
    }
  )
  const packCount = ({ purchases }: Purchase): number =>
    purchases.reduce((total, { count }) => total + count, 0)
  return options.reduce((best, option) =>
    option.cost < best.cost - 1e-9 ||
    (Math.abs(option.cost - best.cost) < 1e-9 && packCount(option) < packCount(best))
      ? option
      : best
  )
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

  entries.forEach(({ slug, build, servings: wanted }) => {
    const recipe = findBasketRecipe(slug)
    if (!recipe) return
    // 6 servings of a 4 serving recipe needs half again of every ingredient
    const scale = wanted / recipe.servings
    servings += wanted
    Object.entries(linesFor(recipe, build)).forEach(([key, quantity]) => {
      const item = BASKET_ITEMS[key]
      if (!item || (item.pantry && !includePantry)) return
      pooled.set(key, [
        ...(pooled.get(key) ?? []),
        { slug, quantity: quantity * scale },
      ])
    })
  })

  const lines = [...pooled.entries()].flatMap(([key, usedBy]) => {
    const item = BASKET_ITEMS[key]
    if (!item) return []
    const quantity = sum(usedBy.map((use) => use.quantity))
    if (isPricedByWeight(item)) {
      const weight = quantity / item.packQuantity
      return [
        {
          key,
          item,
          quantity,
          packs: weight,
          purchases: [],
          cost: weight * item.price,
          proratedCost: weight * item.price,
          leftoverQuantity: 0,
          usedBy,
        },
      ]
    }
    const { cost, purchases } = cheapestPurchase(sizesOf(item), quantity)
    const bought = sum(
      purchases.map(({ size, count }) => size.packQuantity * count)
    )
    return [
      {
        key,
        item,
        quantity,
        packs: sum(purchases.map(({ count }) => count)),
        purchases,
        cost,
        proratedCost: sum(usedBy.map((use) => proratedFor(item, use.quantity))),
        leftoverQuantity: bought - quantity,
        usedBy,
      },
    ]
  })

  const tripCost = sum(lines.map(({ cost }) => cost))
  const proratedCost = sum(lines.map((line) => line.proratedCost))
  // Pooled recipes can buy a bigger pack for less than their shares of smaller ones, so a line
  // can cost less than it is prorated at. That is a saving, not a negative leftover.
  const leftoverOf = ({ cost, proratedCost: used }: BasketLine): number =>
    Math.max(0, cost - used)

  return {
    lines,
    servings,
    tripCost,
    proratedCost,
    leftoverCost: sum(lines.map(leftoverOf)),
    perishableLeftoverCost: sum(
      lines.filter(({ item }) => item.perishable).map(leftoverOf)
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

export type BundleComparison = {
  // Checkout cost per serving: one pooled trip, and each recipe bought on its own trip
  togetherPerServing: number
  alonePerServing: number
  // What is bought but not used: by the pooled trip, and by the separate trips together. The
  // gap is the saving, so this shows how much waste is left, not a second saving.
  leftoverTogether: number
  leftoverAlone: number
}

// The same recipes bought together and bought one at a time, per serving at the register.
// Per serving keeps bundles of different sizes comparable.
export const compareBundle = (
  entries: BasketEntry[],
  options: BasketOptions
): BundleComparison => {
  const together = computeBasket(entries, options)
  const alone = entries.map((entry) => computeBasket([entry], options))
  const perServing = (cost: number): number =>
    together.servings > 0 ? cost / together.servings : 0

  return {
    togetherPerServing: perServing(together.tripCost),
    alonePerServing: perServing(sum(alone.map(({ tripCost }) => tripCost))),
    leftoverTogether: together.leftoverCost,
    leftoverAlone: sum(alone.map(({ leftoverCost }) => leftoverCost)),
  }
}

export type RecipeShare = {
  // This recipe's part of the pooled trip, per serving
  togetherPerServing: number
  // The recipe as written: bought on its own trip at the servings it is written for
  writtenPerServing: number
}

// A recipe as written, bought on its own trip at its own servings, and scaled at that price to
// the servings in the basket. Doubling a recipe compares against buying it twice as written.
const asWritten = (
  entry: BasketEntry,
  options: BasketOptions
): { cost: number; leftover: number; perServing: number } => {
  const recipe = findBasketRecipe(entry.slug)
  if (!recipe) return { cost: 0, leftover: 0, perServing: 0 }
  // The same build as written, so a beef build compares against beef bought as written
  const written = computeBasket(
    [{ ...recipeEntry(entry.slug), ...(entry.build ? { build: entry.build } : {}) }],
    options
  )
  const scale = entry.servings / recipe.servings
  return {
    cost: written.tripCost * scale,
    leftover: written.leftoverCost * scale,
    perServing: written.tripCost / recipe.servings,
  }
}

export type TripComparison = {
  // Every recipe as written, and what that leaves over
  writtenCost: number
  writtenLeftover: number
  // What this trip saves against that: bundling and scaling together
  saving: number
}

// This trip against buying each recipe as written. One saving covers both what pooling shares
// and what cooking more than the recipe's servings fills.
export const compareToWritten = (
  entries: BasketEntry[],
  options: BasketOptions
): TripComparison => {
  const written = entries.map((entry) => asWritten(entry, options))
  const writtenCost = sum(written.map(({ cost }) => cost))
  return {
    writtenCost,
    writtenLeftover: sum(written.map(({ leftover }) => leftover)),
    saving: writtenCost - computeBasket(entries, options).tripCost,
  }
}

// Each recipe's part of the pooled trip at the register, per serving, next to the recipe as
// written. A recipe starts at its own trip's price and takes its part of what pooling saves
// on each item it shares, split by what each recipe would pay for that item alone. So no recipe
// looks dearer for being bundled, and the parts add up to the trip.
export const recipeShares = (
  entries: BasketEntry[],
  options: BasketOptions
): Map<string, RecipeShare> => {
  const together = computeBasket(entries, options)
  const alone = entries.map((entry) => ({
    entry,
    totals: computeBasket([entry], options),
  }))
  const aloneItemCost = (index: number, key: string): number =>
    alone[index]?.totals.lines.find((line) => line.key === key)?.cost ?? 0

  const saved = alone.map(() => 0)
  together.lines.forEach(({ key, cost }) => {
    const separate = alone.map((_, index) => aloneItemCost(index, key))
    const separateTotal = sum(separate)
    const itemSaving = separateTotal - cost
    if (itemSaving <= 0 || separateTotal <= 0) return
    separate.forEach((paid, index) => {
      saved[index] = (saved[index] ?? 0) + itemSaving * (paid / separateTotal)
    })
  })

  return new Map(
    alone.flatMap(({ entry, totals }, index) => {
      if (totals.servings === 0) return []
      return [
        [
          entry.slug,
          {
            togetherPerServing:
              (totals.tripCost - (saved[index] ?? 0)) / totals.servings,
            writtenPerServing: asWritten(entry, options).perServing,
          },
        ],
      ]
    })
  )
}

type BasketSuggestion = {
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

  return BASKET_RECIPES.filter(
    ({ slug, component }) => !component && !inBasket.has(slug)
  )
    .map(({ slug }) => {
      const added = recipeEntry(slug)
      const alone = computeBasket([added], options).tripCost
      const together = computeBasket([...entries, added], options).tripCost
      return { slug, saving: current + alone - together }
    })
    .filter(({ saving }) => saving >= 0.05)
    .sort((a, b) => b.saving - a.saving)[0]
}

type RankedBundle = {
  slugs: string[]
  saving: number
  comparison: BundleComparison
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
    slugs.filter((slug) => BUNDLE_SLUGS.has(slug)),
    size
  )
    .map((group) => {
      const entries = group.map(recipeEntry)
      return {
        slugs: group,
        saving: bundleSavings(entries, options),
        comparison: compareBundle(entries, options),
      }
    })
    .sort((a, b) => b.saving - a.saving)

// The best bundles that don't share a recipe, so a short list shows more of the book
export const pickDistinctBundles = <T extends Pick<RankedBundle, 'slugs'>>(
  ranked: T[],
  count: number
): T[] => {
  const used = new Set<string>()
  return ranked
    .filter(({ slugs }) => {
      if (slugs.some((slug) => used.has(slug))) return false
      slugs.forEach((slug) => used.add(slug))
      return true
    })
    .slice(0, count)
}

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

type BasketSection = {
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

// What to grab, like "2 × 16 oz tub", "1 × 16 oz block + 1 × 8 oz block", "1.5 lb", or just
// "3" for items sold one at a time
export const describePurchase = ({
  item,
  packs,
  purchases,
  quantity,
}: BasketLine): string => {
  if (isPricedByWeight(item)) return `${roundQuantity(quantity)} lb`
  if (item.pack.startsWith('each')) return String(packs)
  return purchases
    .map(({ size, count }) => `${count} × ${size.pack}`)
    .join(' + ')
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
