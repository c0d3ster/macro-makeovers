import type {
  GrocerAdapter,
  HandoffLine,
  HandoffRequest,
  HandoffResult,
} from './groceryTypes'
import type { FetchLike } from './http'

import { HandoffError } from './groceryTypes'
import { requestJson } from './http'

export const INSTACART_PRODUCTION_URL = 'https://connect.instacart.com'
export const INSTACART_DEVELOPMENT_URL = 'https://connect.dev.instacart.tools'

type InstacartConfig = {
  apiKey: string
  // Production or development host. Development keys only work on the development host.
  baseUrl?: string
  // Where the "back to" link on Instacart's page returns, normally our /basket
  linkbackUrl?: string
  fetcher?: FetchLike
}

type LineItem = {
  name: string
  display_text: string
  line_item_measurements: { quantity: number; unit: string }[]
}

type ShoppingListBody = {
  title: string
  link_type: 'shopping_list'
  line_items: LineItem[]
  landing_page_configuration?: { partner_linkback_url: string }
}

type ShoppingListResponse = {
  products_link_url?: string
}

const FAILURE =
  'Instacart could not make your list right now. Copy the list instead, or try again soon.'

// Instacart says to cache a list's link and only ask for a new one when the list changes.
// This cache lives per server instance, which is enough to skip repeat calls on a double tap.
const CACHE_LIMIT = 200

const toLineItem = ({ searchTerm, display, measures }: HandoffLine): LineItem => ({
  name: searchTerm,
  display_text: `${searchTerm} (${display})`,
  line_item_measurements: measures,
})

// Instacart's Create shopping list page: one POST with the lines, back comes a link to a list
// page where the member picks a store and checks out. Instacart matches each line from its
// search term, so every line goes through and none come back unmatched here.
export const createInstacartAdapter = ({
  apiKey,
  baseUrl = INSTACART_PRODUCTION_URL,
  linkbackUrl,
  fetcher = fetch,
}: InstacartConfig): GrocerAdapter => {
  const cache = new Map<string, string>()

  const handoff = async ({ lines }: HandoffRequest): Promise<HandoffResult> => {
    if (lines.length === 0)
      throw new HandoffError('GROCER_NO_MATCHES', 'Your basket has nothing left to buy.')

    const body: ShoppingListBody = {
      title: 'Macro Makeovers shopping list',
      link_type: 'shopping_list',
      line_items: lines.map(toLineItem),
      ...(linkbackUrl
        ? { landing_page_configuration: { partner_linkback_url: linkbackUrl } }
        : {}),
    }
    const cacheKey = JSON.stringify(body)
    const cached = cache.get(cacheKey)
    if (cached) return { grocer: 'instacart', url: cached, matched: lines, unmatched: [] }

    const response = await requestJson<ShoppingListResponse>({
      fetcher,
      url: `${baseUrl}/idp/v1/products/products_link`,
      init: {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: cacheKey,
      },
      failure: FAILURE,
    })
    const url = response?.products_link_url
    if (!url) throw new HandoffError('GROCER_UNAVAILABLE', FAILURE)

    if (cache.size >= CACHE_LIMIT) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
    cache.set(cacheKey, url)
    return { grocer: 'instacart', url, matched: lines, unmatched: [] }
  }

  return { id: 'instacart', handoff }
}
