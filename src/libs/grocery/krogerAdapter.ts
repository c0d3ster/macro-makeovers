import type { KrogerClient } from './krogerApi'
import type {
  GrocerAdapter,
  HandoffLine,
  HandoffRequest,
  HandoffResult,
} from './groceryTypes'

import { HandoffError } from './groceryTypes'

// Kroger banners keep their own sites, and the member's cart shows on their banner's site.
// Anything not listed opens kroger.com, which signs in to the same account.
const BANNER_SITES: Record<string, string> = {
  KROGER: 'www.kroger.com',
  RALPHS: 'www.ralphs.com',
  FREDMEYER: 'www.fredmeyer.com',
  KINGSOOPERS: 'www.kingsoopers.com',
  FRYS: 'www.frysfood.com',
  SMITHS: 'www.smithsfoodanddrug.com',
  QFC: 'www.qfc.com',
  MARIANOS: 'www.marianos.com',
  HARRISTEETER: 'www.harristeeter.com',
  DILLONS: 'www.dillons.com',
  PICKNSAVE: 'www.picknsave.com',
  METROMARKET: 'www.metromarket.net',
  CITYMARKET: 'www.citymarket.com',
  BAKERS: 'www.bakersplus.com',
  GERBES: 'www.gerbes.com',
  JAYC: 'www.jaycfoods.com',
  PAYLESS: 'www.pay-less.com',
  FOOD4LESS: 'www.food4less.com',
  FOODSCO: 'www.foodsco.net',
}

export const krogerCartUrl = (chain?: string): string => {
  const site = BANNER_SITES[(chain ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')]
  return `https://${site ?? 'www.kroger.com'}/cart`
}

// Searches run a few at a time so a 30 line basket doesn't fire 30 calls at once
const SEARCH_CONCURRENCY = 5

const mapInBatches = async <T, R>(
  items: T[],
  size: number,
  map: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = []
  for (let start = 0; start < items.length; start += size) {
    results.push(...(await Promise.all(items.slice(start, start + size).map(map))))
  }
  return results
}

type KrogerAdapterConfig = {
  client: KrogerClient
  // The member's Kroger access token, refreshed if needed. Undefined until they connect Kroger.
  getMemberToken: () => Promise<string | undefined>
}

// Kroger: a real cart at the member's own store, at in-store prices with their digital coupons.
// Each line is searched at the store for a UPC, then the matches go into the cart for pickup.
// The public Cart API can add but not read or remove, so a second send adds the items again.
export const createKrogerAdapter = ({
  client,
  getMemberToken,
}: KrogerAdapterConfig): GrocerAdapter => {
  const handoff = async ({ lines, storeId }: HandoffRequest): Promise<HandoffResult> => {
    if (!storeId)
      throw new HandoffError('GROCER_STORE_REQUIRED', 'Pick your Kroger store first.')
    const memberToken = await getMemberToken()
    if (!memberToken)
      throw new HandoffError(
        'GROCER_AUTH_REQUIRED',
        'Connect your Kroger account to send your basket.'
      )

    const found = await mapInBatches(lines, SEARCH_CONCURRENCY, async (line) => ({
      line,
      product: await client.findProduct(line.searchTerm, storeId),
    }))
    const matched = found.flatMap(({ line, product }) =>
      product?.upc ? [{ line, upc: product.upc }] : []
    )
    const unmatched: HandoffLine[] = found
      .filter(({ product }) => !product?.upc)
      .map(({ line }) => line)
    if (matched.length === 0)
      throw new HandoffError(
        'GROCER_NO_MATCHES',
        'Kroger found none of these items at your store. Copy the list instead.'
      )

    await client.addToCart(
      memberToken,
      matched.map(({ line, upc }) => ({ upc, quantity: line.packCount }))
    )
    // The cart link is a nicety: if the store lookup fails, kroger.com still works
    const chain = await client.storeChain(storeId).catch(() => undefined)

    return {
      grocer: 'kroger',
      url: krogerCartUrl(chain),
      matched: matched.map(({ line }) => line),
      unmatched,
    }
  }

  return { id: 'kroger', handoff, findStores: client.findStores }
}
