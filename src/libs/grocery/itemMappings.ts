import type { BasketItem, PackSize } from '@/libs/basket'

import type { HandoffMeasure } from './groceryTypes'

// How each basket item maps to grocers: a search term for grocers that match by search
// (Instacart, Kroger), and an item id for grocers that need one (Walmart). PRD 05 asks for the
// mapping to live with the basket data, keyed by the same item keys.

// Search terms where the name made into a term reads badly or names one store's brand. Most
// items need nothing here: their name becomes the term (see searchTermFor).
const SEARCH_TERMS: Record<string, string> = {
  pollo_asado: 'precooked pollo asado chicken',
  ribeye: 'ribeye steak',
  flank: 'flank steak',
  eye_of_round: 'beef eye of round roast',
  chuck: 'boneless beef chuck roast',
  ham: 'honey ham lunch meat',
  prosciutto: 'prosciutto',
  canadian: 'canadian bacon',
  pouch: 'tuna pouch',
  albacore: 'chunk white albacore tuna',
  butter: 'salted butter sticks',
  milk: 'fairlife fat free milk',
  eggs: 'large eggs',
  cheddar: 'extra sharp white cheddar cheese block',
  parm: 'grated parmesan cheese',
  provolone: 'sliced provolone cheese',
  rolls: "king's hawaiian rolls",
  hoagie: 'hoagie rolls',
  tortilla: '8 inch flour tortillas',
  panko: 'panko bread crumbs',
  pasta: 'penne pasta',
  hashbrowns: 'diced hash browns frozen',
  saltines: 'saltine crackers',
  garlic: 'garlic bulb',
  jalapeno: 'jalapeno peppers',
  habanero: 'habanero peppers',
  avocado: 'hass avocado',
  herbs: 'fresh dill',
  pear: 'asian pear',
  oj: 'orange juice pulp free',
  adobo: 'chipotle peppers in adobo sauce',
  shrimp: 'raw peeled deveined shrimp',
  yogurt: 'nonfat plain greek yogurt cup',
  yogurt5: 'whole milk plain greek yogurt cup',
  corn_tortilla: 'white corn tortillas',
  quesadilla: 'oaxaca cheese',
  vinegar: 'distilled white vinegar',
  pepper: 'ground black pepper',
  cayenne: 'ground cayenne pepper',
  oregano: 'dried oregano',
  blackening: 'blackening seasoning',
  lemon_pepper: 'lemon pepper seasoning',
  dill_dried: 'dried dill weed',
  red_pepper: 'crushed red pepper flakes',
}

// Walmart item ids for the add-to-cart link, by basket item key. Empty until curated: seed them
// from Walmart's Affiliate API search once access is approved, check each by hand, and recheck
// monthly for discontinued items (docs/grocery-services.md). Items without an id come back as
// unmatched lines, so a partial map still hands off what it can.
export const WALMART_ITEM_IDS: Record<string, string> = {}

// "Chicken breast, boneless skinless (Kroger)" reads as "boneless skinless chicken breast":
// the brand or store in brackets goes, and the words after the comma come first
const termFromName = (name: string): string => {
  const plain = name.replace(/\s*\([^)]*\)/g, '').trim()
  const [head, ...rest] = plain.split(', ')
  return [...rest.reverse(), head].join(' ').toLowerCase()
}

export const searchTermFor = (key: string, item: BasketItem): string =>
  SEARCH_TERMS[key] ?? termFromName(item.name)

// Instacart's unit for a size on a shelf label, with the container where it helps matching
// (Instacart takes "fl oz can" and "fl oz jar" but not a bare "fl oz")
const fluidOunceUnit = (pack: string): string => {
  if (/\bcan\b/.test(pack)) return 'fl oz can'
  if (/\bjar\b/.test(pack)) return 'fl oz jar'
  return 'fl oz container'
}

// The amount one pack holds, read from its shelf label: "16 oz tub", "2 lb bag", "12 ct",
// "52 fl oz bottle". Labels without a size, like "bunch", give nothing.
const sizeOfPack = (pack: string): HandoffMeasure | undefined => {
  const fluid = /^(\d+(?:\.\d+)?) fl oz\b/.exec(pack)
  if (fluid) return { quantity: Number(fluid[1]), unit: fluidOunceUnit(pack) }
  const sized = /^(\d+(?:\.\d+)?) (oz|lb|ct)\b/.exec(pack)
  if (!sized) return undefined
  const unit = sized[2] === 'ct' ? 'each' : sized[2]
  return { quantity: Number(sized[1]), unit: unit ?? 'each' }
}

// Countable produce sold by a word, not a size
const countUnitOf = (pack: string): string | undefined => {
  if (pack.startsWith('each')) return 'each'
  if (pack.startsWith('bunch')) return 'bunch'
  if (pack.startsWith('head')) return 'head'
  return undefined
}

const round = (value: number): number => Math.round(value * 100) / 100

// What a line buys, in units Instacart can match: the total size first ("32 oz"), then the pack
// count as a fallback ("2 package"). Items priced by weight go by the pound.
export const measuresFor = (
  purchases: { size: PackSize; count: number }[],
  packCount: number,
  pounds?: number
): HandoffMeasure[] => {
  if (pounds !== undefined) return [{ quantity: round(pounds), unit: 'lb' }]

  const first = purchases[0]?.size.pack ?? ''
  const countUnit = countUnitOf(first)
  if (countUnit) return [{ quantity: packCount, unit: countUnit }]

  const sizes = purchases.map(({ size, count }) => {
    const measure = sizeOfPack(size.pack)
    return measure ? { ...measure, quantity: measure.quantity * count } : undefined
  })
  const [firstSize] = sizes
  const sameUnit =
    firstSize !== undefined &&
    sizes.every((size) => size !== undefined && size.unit === firstSize.unit)
  const packages = { quantity: packCount, unit: 'package' }
  if (!sameUnit) return [packages]

  const total = sizes.reduce(
    (sum, size) => sum + (size?.quantity ?? 0),
    0
  )
  return [{ quantity: round(total), unit: firstSize.unit }, packages]
}
