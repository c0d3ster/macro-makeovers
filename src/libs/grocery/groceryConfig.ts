import { Env } from '@/libs/Env'
import { getBaseUrl } from '@/utils/Env'

import type { GrocerAdapter, GrocerId } from './groceryTypes'
import type { KrogerClient, KrogerCredentials } from './krogerApi'

import { createInstacartAdapter, INSTACART_PRODUCTION_URL } from './instacartAdapter'
import { WALMART_ITEM_IDS } from './itemMappings'
import { createKrogerAdapter } from './krogerAdapter'
import { createKrogerClient, KROGER_API_URL } from './krogerApi'
import { getKrogerMemberToken } from './krogerSession'
import { createWalmartAdapter } from './walmartAdapter'

// Server only: reads the grocer keys from the environment. A grocer is offered once its keys are
// set, so with none set the basket keeps its placeholder.

export const krogerRedirectUri = (): string =>
  `${getBaseUrl()}/api/grocery/kroger/callback`

export const krogerCredentials = (): KrogerCredentials | undefined =>
  Env.KROGER_CLIENT_ID && Env.KROGER_CLIENT_SECRET
    ? {
        clientId: Env.KROGER_CLIENT_ID,
        clientSecret: Env.KROGER_CLIENT_SECRET,
        baseUrl: Env.KROGER_API_URL ?? KROGER_API_URL,
      }
    : undefined

// Kroger also needs the cookie secret, since its member tokens are sealed in a cookie
export const groceryTokenSecret = (): string | undefined => Env.GROCERY_TOKEN_SECRET

// Grocers that are fully configured, in the picker's order
export const availableGrocers = (): GrocerId[] => {
  const grocers: GrocerId[] = []
  if (krogerCredentials() && groceryTokenSecret()) grocers.push('kroger')
  // Walmart can't take a single line until its item ids are curated
  if (Object.keys(WALMART_ITEM_IDS).length > 0) grocers.push('walmart')
  if (Env.INSTACART_API_KEY) grocers.push('instacart')
  return grocers
}

// Grocers that pay us for orders, for the disclosure
export const commissionGrocers = (available: GrocerId[]): GrocerId[] =>
  available.filter(
    (id) => id === 'instacart' || (id === 'walmart' && Boolean(Env.WALMART_AFFILIATE_LINK))
  )

// One Kroger client per server instance, so its app token is reused between requests
let krogerClient: KrogerClient | undefined
export const getKrogerClient = (): KrogerClient | undefined => {
  const credentials = krogerCredentials()
  if (!credentials) return undefined
  krogerClient ??= createKrogerClient(credentials)
  return krogerClient
}

let instacartAdapter: GrocerAdapter | undefined

export const getGrocerAdapter = (id: GrocerId): GrocerAdapter | undefined => {
  if (!availableGrocers().includes(id)) return undefined
  if (id === 'instacart') {
    if (!Env.INSTACART_API_KEY) return undefined
    instacartAdapter ??= createInstacartAdapter({
      apiKey: Env.INSTACART_API_KEY,
      baseUrl: Env.INSTACART_API_URL ?? INSTACART_PRODUCTION_URL,
      linkbackUrl: `${getBaseUrl()}/basket`,
    })
    return instacartAdapter
  }
  if (id === 'walmart')
    return createWalmartAdapter({ affiliateLink: Env.WALMART_AFFILIATE_LINK })
  const client = getKrogerClient()
  const credentials = krogerCredentials()
  const secret = groceryTokenSecret()
  if (!client || !credentials || !secret) return undefined
  return createKrogerAdapter({
    client,
    getMemberToken: () => getKrogerMemberToken(credentials, secret),
  })
}
