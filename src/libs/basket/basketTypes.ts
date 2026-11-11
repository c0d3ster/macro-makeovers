// Where an item sits in the store, used to group the shopping list
export type StoreSection =
  'produce' | 'meat' | 'dairy' | 'bakery' | 'frozen' | 'pantry' | 'spices'

// One size a product is sold in
export type PackSize = {
  pack: string
  packQuantity: number
  price: number
}

// One product as it is sold
export type BasketItem = {
  name: string
  // The pack as the shelf labels it, like "16 oz tub" or "per lb"
  pack: string
  // How much of `unit` one pack holds. For "per lb" items, 1 lb.
  packQuantity: number
  unit: string
  // Price of one pack (or one lb for "per lb" items)
  price: number
  section: StoreSection
  // A staple most kitchens already have, like oil and spices
  pantry: boolean
  // Spoils fast once opened, so a leftover is likely wasted
  perishable: boolean
  // Larger sizes of the same product. The pack above is the smallest. A recipe is priced from
  // the smallest size that covers what it uses, and a trip buys the cheapest mix of sizes.
  sizes?: PackSize[]
}

// What one batch of a recipe uses, by item key, in each item's unit
export type BasketRecipe = {
  slug: string
  servings: number
  // The cost estimate per serving, prorated by what the recipe uses
  perServingCost: number
  lines: Record<string, number>
}

// A recipe in the basket and how many servings of it to cook
export type BasketEntry = {
  slug: string
  // The recipe build's key. Missing means the default build. Price lines are the recipe's
  // until a build has lines of its own.
  build?: string
  // Scales the recipe's ingredients the way the recipe page's servings stepper does
  servings: number
}
