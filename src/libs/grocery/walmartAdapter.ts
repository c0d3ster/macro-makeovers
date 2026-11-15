import type {
  GrocerAdapter,
  HandoffRequest,
  HandoffResult,
} from './groceryTypes'

import { HandoffError } from './groceryTypes'
import { WALMART_ITEM_IDS } from './itemMappings'

const ADD_TO_CART_URL = 'https://www.walmart.com/sc/cart/addToCart'

type WalmartConfig = {
  // Item ids by basket item key. Defaults to the curated map in itemMappings.
  itemIds?: Record<string, string>
  // An Impact tracking link (goto.walmart.com/c/...). When set, the cart link is wrapped in it
  // so orders earn a commission. The link works without it.
  affiliateLink?: string
}

// Walmart's add-to-cart service: a plain link that fills a Walmart cart, with no sign-in on our
// side. It needs a Walmart item id per line, so lines without one come back unmatched.
// Still to test before launch: that the link with storeId fills a pickup grocery cart, not a
// ship-to-home one (docs/grocery-services.md, open question 1).
export const createWalmartAdapter = ({
  itemIds = WALMART_ITEM_IDS,
  affiliateLink,
}: WalmartConfig = {}): GrocerAdapter => {
  const handoff = async ({
    lines,
    storeId,
  }: HandoffRequest): Promise<HandoffResult> => {
    const matched = lines.filter(({ key }) => itemIds[key])
    const unmatched = lines.filter(({ key }) => !itemIds[key])
    if (matched.length === 0)
      throw new HandoffError(
        'GROCER_NO_MATCHES',
        'None of these items are mapped to Walmart yet. Copy the list instead.'
      )

    const items = matched
      .map(({ key, packCount }) => `${itemIds[key]}_${packCount}`)
      .join(',')
    const params = new URLSearchParams({ items })
    if (storeId) params.set('storeId', storeId)
    const cartUrl = `${ADD_TO_CART_URL}?${params.toString()}`
    const url = affiliateLink
      ? `${affiliateLink}${affiliateLink.includes('?') ? '&' : '?'}u=${encodeURIComponent(cartUrl)}`
      : cartUrl

    return { grocer: 'walmart', url, matched, unmatched }
  }

  return { id: 'walmart', handoff }
}
