import type { GrocerId } from './groceryTypes'

// What the picker says about each grocer. Pickup is the default mode everywhere because it is
// the only mode where checkout lands near our in-store estimate (docs/grocery-services.md).
export type GrocerInfo = {
  id: GrocerId
  name: string
  // One line under the name: what kind of handoff it is
  summary: string
  // What checkout costs beyond our estimate. Shown before the handoff, never after.
  feeNote: string
  // A plain warning for grocers whose prices or fees run above in-store. Instacart only.
  priceNote?: string
  // The send button's text. Instacart's terms fix theirs to "Shop on Instacart".
  sendLabel: string
  // The link to the result
  openLabel: string
  // The member signs in to the grocer before the first send
  needsAccount: boolean
}

export const GROCERS: Record<GrocerId, GrocerInfo> = {
  kroger: {
    id: 'kroger',
    name: 'Kroger',
    summary:
      'Fills your cart at your own Kroger-family store (Ralphs, Fred Meyer, King Soopers and more).',
    feeNote:
      'Pickup is free over $35. Same prices as in store, and your digital coupons apply.',
    sendLabel: 'Send to my Kroger cart',
    openLabel: 'Open your Kroger cart',
    needsAccount: true,
  },
  walmart: {
    id: 'walmart',
    name: 'Walmart',
    summary: 'Fills a Walmart cart. Choose pickup at checkout.',
    feeNote:
      'Pickup is free over $35. Prices follow the store that packs your order.',
    sendLabel: 'Send to my Walmart cart',
    openLabel: 'Open your Walmart cart',
    needsAccount: false,
  },
  instacart: {
    id: 'instacart',
    name: 'Instacart',
    summary:
      'Other stores and delivery: Costco, Publix, Aldi, Safeway and more. You pick the store on Instacart.',
    feeNote: 'Delivery adds a service fee, a delivery fee, and a tip.',
    priceNote:
      'Many stores on Instacart charge more than their shelf prices, so checkout will likely cost more than our estimate.',
    sendLabel: 'Shop on Instacart',
    openLabel: 'Open your list on Instacart',
    needsAccount: false,
  },
}

// Shown on the picker next to the grocers that pay us for orders (PRD 02 phase 4, FTC endorsement
// guides). It sits by the links, not in a footer. Empty when none of the listed grocers pay.
export const affiliateDisclosure = (paidGrocers: GrocerId[]): string => {
  const names = paidGrocers.map((id) => GROCERS[id].name)
  if (names.length === 0) return ''
  return `We may earn a commission when you check out through ${names.join(' or ')}. It never changes your price, and it never decides which store we suggest.`
}

// Our numbers stay labeled as in-store estimates next to every grocer
export const ESTIMATE_NOTE =
  "Our total is an estimated in-store cost. The grocer's checkout total is theirs, and can differ."
