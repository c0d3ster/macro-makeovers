// The grocers "Send to cart" can hand a basket to (PRD 05, docs/grocery-services.md)
export type GrocerId = 'kroger' | 'walmart' | 'instacart'

export const GROCER_IDS: GrocerId[] = ['kroger', 'walmart', 'instacart']

export const isGrocerId = (value: string): value is GrocerId =>
  (GROCER_IDS as string[]).includes(value)

// One amount of a line, in a unit grocers understand. A line can carry a few, like "32 oz" and
// "2 package", so a grocer can match whichever its catalog uses.
export type HandoffMeasure = {
  quantity: number
  unit: string
}

// One line of the basket as a grocer sees it: what the basket would buy, ready to search
export type HandoffLine = {
  // The basket item key
  key: string
  // The item as the shopping list names it
  name: string
  // What to search a grocer's catalog for
  searchTerm: string
  // Whole packs to buy. Items priced by weight round up to whole pounds.
  packCount: number
  // Pounds to buy, for items priced by weight
  pounds?: number
  measures: HandoffMeasure[]
  // What the shopping list says to grab, like "2 × 16 oz tub"
  display: string
}

// A store the member picked, like a Kroger location
export type GroceryStore = {
  id: string
  name: string
  address: string
}

export type HandoffRequest = {
  lines: HandoffLine[]
  storeId?: string
}

// What a handoff produced: where to send the member, and what didn't make it
export type HandoffResult = {
  grocer: GrocerId
  url: string
  // Lines the grocer received, as a cart write or a list
  matched: HandoffLine[]
  // Lines the grocer could not take. Shown to the member, never dropped.
  unmatched: HandoffLine[]
}

// A grocer could not take the handoff for a reason the member can act on
export type HandoffErrorCode =
  // The grocer needs the member to sign in to their account first
  | 'GROCER_AUTH_REQUIRED'
  // The grocer needs a store before it can match items
  | 'GROCER_STORE_REQUIRED'
  // The grocer's API failed or refused the request
  | 'GROCER_UNAVAILABLE'
  // Nothing in the basket matched at this grocer
  | 'GROCER_NO_MATCHES'

export class HandoffError extends Error {
  constructor(
    readonly code: HandoffErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'HandoffError'
  }
}

// One adapter per grocer. Adding a grocer means adding an adapter and its item mapping, with no
// change to the basket or the picker (PRD 05 requirement 7).
export type GrocerAdapter = {
  id: GrocerId
  handoff: (request: HandoffRequest) => Promise<HandoffResult>
  // Stores near a zip code, for grocers where the member picks one
  findStores?: (zip: string) => Promise<GroceryStore[]>
}
