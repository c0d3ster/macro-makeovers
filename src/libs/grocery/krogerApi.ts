import type { GroceryStore } from './groceryTypes'
import type { FetchLike } from './http'

import { HandoffError } from './groceryTypes'
import { requestJson } from './http'

// Kroger's public APIs: Identity (OAuth), Locations, Products and Cart. Kroger's developer docs
// render client-side, so the paths and fields here follow the public API as commonly used.
// Check them against the portal once the app is registered.
export const KROGER_API_URL = 'https://api.kroger.com'

// Scopes: product.compact for the app's own product and location calls, cart.basic:write for
// adding to the member's cart. Kroger refuses sign-in if a scope isn't registered for the app.
export const KROGER_APP_SCOPE = 'product.compact'
export const KROGER_MEMBER_SCOPE = 'cart.basic:write'

export type KrogerCredentials = {
  clientId: string
  clientSecret: string
  baseUrl?: string
  fetcher?: FetchLike
}

export type KrogerTokens = {
  accessToken: string
  refreshToken?: string
  // Epoch milliseconds
  expiresAt: number
}

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
}

const FAILURE =
  'Kroger is not responding right now. Copy the list instead, or try again soon.'
const SIGN_IN_FAILURE = 'Sign in to Kroger again to send your basket.'

const basicAuth = (clientId: string, clientSecret: string): string =>
  `Basic ${btoa(`${clientId}:${clientSecret}`)}`

const requestToken = async (
  { clientId, clientSecret, baseUrl = KROGER_API_URL, fetcher = fetch }: KrogerCredentials,
  form: Record<string, string>,
  now: number
): Promise<KrogerTokens> => {
  const response = await requestJson<TokenResponse>({
    fetcher,
    url: `${baseUrl}/v1/connect/oauth2/token`,
    init: {
      method: 'POST',
      headers: {
        'Authorization': basicAuth(clientId, clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(form).toString(),
    },
    failure: SIGN_IN_FAILURE,
    authCode: 'GROCER_AUTH_REQUIRED',
  })
  if (!response?.access_token)
    throw new HandoffError('GROCER_AUTH_REQUIRED', SIGN_IN_FAILURE)
  return {
    accessToken: response.access_token,
    ...(response.refresh_token ? { refreshToken: response.refresh_token } : {}),
    expiresAt: now + (response.expires_in ?? 1800) * 1000,
  }
}

// Where the member signs in to Kroger and lets us add to their cart
export const krogerAuthorizeUrl = ({
  clientId,
  redirectUri,
  state,
  baseUrl = KROGER_API_URL,
}: {
  clientId: string
  redirectUri: string
  state: string
  baseUrl?: string
}): string => {
  const params = new URLSearchParams({
    scope: KROGER_MEMBER_SCOPE,
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  })
  return `${baseUrl}/v1/connect/oauth2/authorize?${params.toString()}`
}

export const exchangeKrogerCode = (
  credentials: KrogerCredentials,
  { code, redirectUri }: { code: string; redirectUri: string },
  now: number = Date.now()
): Promise<KrogerTokens> =>
  requestToken(
    credentials,
    { grant_type: 'authorization_code', code, redirect_uri: redirectUri },
    now
  )

export const refreshKrogerTokens = async (
  credentials: KrogerCredentials,
  refreshToken: string,
  now: number = Date.now()
): Promise<KrogerTokens> => {
  const tokens = await requestToken(
    credentials,
    { grant_type: 'refresh_token', refresh_token: refreshToken },
    now
  )
  // Kroger may not send a new refresh token. Keep the old one then.
  return { refreshToken, ...tokens }
}

type KrogerLocation = {
  locationId?: string
  chain?: string
  name?: string
  address?: {
    addressLine1?: string
    city?: string
    state?: string
    zipCode?: string
  }
}

type KrogerProduct = {
  upc?: string
  description?: string
}

export type KrogerClient = {
  findStores: (zip: string) => Promise<GroceryStore[]>
  // The first product a search finds at the store, if any
  findProduct: (term: string, locationId: string) => Promise<KrogerProduct | undefined>
  // The banner a store belongs to, like KROGER or RALPHS
  storeChain: (locationId: string) => Promise<string | undefined>
  addToCart: (
    memberToken: string,
    items: { upc: string; quantity: number }[]
  ) => Promise<void>
}

// Stores within this many miles of a zip count as nearby for the first-time default
export const KROGER_STORE_RADIUS_MILES = 10
const STORE_LIMIT = 5
// Refresh the app token a minute early so a call never goes out with one about to lapse
const EXPIRY_MARGIN_MS = 60_000

const toStore = ({ locationId, name, chain, address }: KrogerLocation): GroceryStore[] =>
  locationId
    ? [
        {
          id: locationId,
          name: name ?? chain ?? 'Kroger',
          address: [address?.addressLine1, address?.city, address?.state]
            .filter(Boolean)
            .join(', '),
        },
      ]
    : []

// The app's own Kroger calls (stores, products) on a client-credentials token, cached until it
// lapses, plus the cart write on the member's token
export const createKrogerClient = (
  credentials: KrogerCredentials,
  clock: () => number = Date.now
): KrogerClient => {
  const { baseUrl = KROGER_API_URL, fetcher = fetch } = credentials
  // The pending request is cached too, so a batch of parallel searches shares one token call
  let appToken: Promise<KrogerTokens> | undefined

  const fetchAppToken = (): Promise<KrogerTokens> =>
    requestToken(
      credentials,
      { grant_type: 'client_credentials', scope: KROGER_APP_SCOPE },
      clock()
    )

  const getAppToken = async (): Promise<string> => {
    appToken ??= fetchAppToken()
    const pending = appToken
    try {
      const token = await pending
      if (token.expiresAt - EXPIRY_MARGIN_MS > clock()) return token.accessToken
    } catch {
      // A failed token call is retried below, once
    }
    // Lapsed or failed: start a fresh call, unless a parallel search already did
    if (appToken === pending) appToken = fetchAppToken()
    return (await appToken).accessToken
  }

  const appGet = async <T>(path: string, params: Record<string, string>): Promise<T | undefined> => {
    const token = await getAppToken()
    return requestJson<T>({
      fetcher,
      url: `${baseUrl}${path}?${new URLSearchParams(params).toString()}`,
      init: {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      },
      failure: FAILURE,
    })
  }

  return {
    findStores: async (zip) => {
      const response = await appGet<{ data?: KrogerLocation[] }>('/v1/locations', {
        'filter.zipCode.near': zip,
        'filter.radiusInMiles': String(KROGER_STORE_RADIUS_MILES),
        'filter.limit': String(STORE_LIMIT),
      })
      return (response?.data ?? []).flatMap(toStore)
    },
    findProduct: async (term, locationId) => {
      const response = await appGet<{ data?: KrogerProduct[] }>('/v1/products', {
        'filter.term': term,
        'filter.locationId': locationId,
        'filter.limit': '5',
      })
      return response?.data?.find(({ upc }) => Boolean(upc))
    },
    storeChain: async (locationId) => {
      const response = await appGet<{ data?: KrogerLocation }>(
        `/v1/locations/${encodeURIComponent(locationId)}`,
        {}
      )
      return response?.data?.chain
    },
    addToCart: async (memberToken, items) => {
      await requestJson({
        fetcher,
        url: `${baseUrl}/v1/cart/add`,
        init: {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${memberToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: items.map((item) => ({ ...item, modality: 'PICKUP' })),
          }),
        },
        failure: SIGN_IN_FAILURE,
        authCode: 'GROCER_AUTH_REQUIRED',
      })
    },
  }
}
