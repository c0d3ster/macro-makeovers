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
  // Looked up and not yet checked on a shelf or a receipt
  isEstimate?: boolean
  // When the price was found, as YYYY-MM-DD
  pricedOn?: string
}

// A build that shops differently from its recipe, like beef in place of turkey
export type BasketBuild = {
  // Changes to the recipe's lines, by item key. 0 drops a line the build doesn't use.
  lines: Record<string, number>
}

// What one batch of a recipe uses, by item key, in each item's unit. Cost per serving is
// worked out from these and the item prices, never stored.
export type BasketRecipe = {
  slug: string
  servings: number
  lines: Record<string, number>
  // A side or sauce. The dishes that use it already carry its lines, so bundle suggestions
  // leave it out.
  component?: boolean
  // Builds by key whose shopping differs. A build not listed shops like the recipe.
  builds?: Record<string, BasketBuild>
}

// A recipe in the basket and how many servings of it to cook
export type BasketEntry = {
  slug: string
  // The recipe build's key. Missing means the default build. A build without lines of its own
  // shops like the recipe.
  build?: string
  // Scales the recipe's ingredients the way the recipe page's servings stepper does
  servings: number
}

// Everything the basket math prices from: the price book and every shoppable recipe. Loaded
// from the database (BasketRepository) and passed in, so the math stays pure.
export type BasketCatalog = {
  items: Record<string, BasketItem>
  recipes: BasketRecipe[]
  // The oldest and newest price dates, as YYYY-MM-DD. Missing when there are no items.
  pricedFrom?: string
  pricedThrough?: string
}
