// Where an item sits in the store, used to group the shopping list
export type StoreSection =
  'produce' | 'meat' | 'dairy' | 'bakery' | 'frozen' | 'pantry' | 'spices'

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
}

// What one batch of a recipe uses, by item key, in each item's unit
export type BasketRecipe = {
  slug: string
  servings: number
  // The cost estimate per serving, prorated by what the recipe uses
  perServingCost: number
  lines: Record<string, number>
}

// A recipe in the basket and how many batches of it
export type BasketEntry = {
  slug: string
  batches: number
}
