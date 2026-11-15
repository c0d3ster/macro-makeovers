import { describe, expect, it } from 'vitest'

import { createKrogerAdapter, krogerCartUrl } from './krogerAdapter'
import {
  createKrogerClient,
  exchangeKrogerCode,
  krogerAuthorizeUrl,
  refreshKrogerTokens,
} from './krogerApi'
import { mockFetch, testLine } from './testLines'

const BASE = 'https://api.kroger.test'
const CREDENTIALS = { clientId: 'id', clientSecret: 'secret', baseUrl: BASE }

type Routes = {
  products?: Record<string, string | undefined>
  cartStatus?: number
  chain?: string
}

// Answers Kroger's token, product, location and cart calls like the real API
const krogerFetch = ({ products = {}, cartStatus = 204, chain = 'RALPHS' }: Routes = {}) =>
  mockFetch((url, init) => {
    const { pathname, searchParams } = new URL(url)
    if (pathname === '/v1/connect/oauth2/token')
      return { body: { access_token: 'app-token', expires_in: 1800 } }
    if (pathname === '/v1/products') {
      const upc = products[searchParams.get('filter.term') ?? '']
      return { body: { data: upc ? [{ upc, description: 'x' }] : [] } }
    }
    if (pathname === '/v1/locations')
      return {
        body: {
          data: [
            {
              locationId: '70300022',
              chain: 'RALPHS',
              name: 'Ralphs Sunset',
              address: { addressLine1: '1 Main St', city: 'Los Angeles', state: 'CA' },
            },
            { name: 'No id, skipped' },
          ],
        },
      }
    if (pathname.startsWith('/v1/locations/')) return { body: { data: { chain } } }
    if (pathname === '/v1/cart/add' && init?.method === 'PUT') return { status: cartStatus }
    return { status: 404 }
  })

const setup = (routes?: Routes, { connected = true } = {}) => {
  const { fetcher, calls } = krogerFetch(routes)
  const client = createKrogerClient({ ...CREDENTIALS, fetcher })
  const adapter = createKrogerAdapter({ client, getMemberToken: async () => (connected ? 'member-token' : undefined),
  })
  return { adapter, calls }
}

describe('createKrogerAdapter', () => {
  it('finds each line at the store and adds the matches to the cart for pickup', async () => {
    const { adapter, calls } = setup({
      products: { 'eggs term': '0001111060903', 'milk term': '0001111041700' },
    })

    const result = await adapter.handoff({
      lines: [testLine('eggs', { packCount: 2 }), testLine('milk'), testLine('achiote')],
      storeId: '70300022',
    })

    expect(result.grocer).toBe('kroger')
    expect(result.url).toBe('https://www.ralphs.com/cart')
    expect(result.matched.map(({ key }) => key)).toEqual(['eggs', 'milk'])
    expect(result.unmatched.map(({ key }) => key)).toEqual(['achiote'])

    const search = calls.find(({ url }) => url.includes('/v1/products'))

    expect(new URL(search?.url ?? '').searchParams.get('filter.locationId')).toBe('70300022')

    const cart = calls.find(({ url }) => url.endsWith('/v1/cart/add'))

    expect(new Headers(cart?.init?.headers).get('Authorization')).toBe('Bearer member-token')
    expect(JSON.parse(String(cart?.init?.body))).toEqual({
      items: [
        { upc: '0001111060903', quantity: 2, modality: 'PICKUP' },
        { upc: '0001111041700', quantity: 1, modality: 'PICKUP' },
      ],
    })
  })

  it('gets the app token once and reuses it', async () => {
    const { adapter, calls } = setup({ products: { 'eggs term': '1' } })

    await adapter.handoff({ lines: [testLine('eggs'), testLine('milk')], storeId: 's' })

    expect(calls.filter(({ url }) => url.includes('/oauth2/token'))).toHaveLength(1)
  })

  it('needs a store and a connected account before it calls Kroger', async () => {
    const withStore = setup({}, { connected: false })
    const noStore = setup()

    await expect(noStore.adapter.handoff({ lines: [testLine('eggs')] })).rejects.toMatchObject({
      code: 'GROCER_STORE_REQUIRED',
    })
    await expect(
      withStore.adapter.handoff({ lines: [testLine('eggs')], storeId: 's' })
    ).rejects.toMatchObject({ code: 'GROCER_AUTH_REQUIRED' })
    expect(noStore.calls).toHaveLength(0)
    expect(withStore.calls).toHaveLength(0)
  })

  it('asks the member to sign in again when Kroger refuses their token', async () => {
    const { adapter } = setup({ products: { 'eggs term': '1' }, cartStatus: 401 })

    await expect(
      adapter.handoff({ lines: [testLine('eggs')], storeId: 's' })
    ).rejects.toMatchObject({ code: 'GROCER_AUTH_REQUIRED' })
  })

  it('fails without a cart write when nothing matches', async () => {
    const { adapter, calls } = setup()

    await expect(
      adapter.handoff({ lines: [testLine('eggs')], storeId: 's' })
    ).rejects.toMatchObject({ code: 'GROCER_NO_MATCHES' })
    expect(calls.some(({ url }) => url.endsWith('/v1/cart/add'))).toBe(false)
  })

  it('finds stores near a zip', async () => {
    const { adapter, calls } = setup()

    await expect(adapter.findStores?.('90028')).resolves.toEqual([
      { id: '70300022', name: 'Ralphs Sunset', address: '1 Main St, Los Angeles, CA' },
    ])

    const search = new URL(calls.at(-1)?.url ?? '')

    expect(search.searchParams.get('filter.zipCode.near')).toBe('90028')
  })
})

describe('krogerCartUrl', () => {
  it('opens the banner site, or kroger.com for anything else', () => {
    expect(krogerCartUrl('FRED MEYER')).toBe('https://www.fredmeyer.com/cart')
    expect(krogerCartUrl(undefined)).toBe('https://www.kroger.com/cart')
    expect(krogerCartUrl('SOMETHING NEW')).toBe('https://www.kroger.com/cart')
  })
})

describe('Kroger sign-in', () => {
  it('asks for the cart scope with our redirect and state', () => {
    const url = new URL(
      krogerAuthorizeUrl({
        clientId: 'id',
        redirectUri: 'https://macromakeovers.com/api/grocery/kroger/callback',
        state: 'abc',
        baseUrl: BASE,
      })
    )

    expect(url.pathname).toBe('/v1/connect/oauth2/authorize')
    expect(url.searchParams.get('scope')).toBe('cart.basic:write')
    expect(url.searchParams.get('state')).toBe('abc')
    expect(url.searchParams.get('response_type')).toBe('code')
  })

  it('swaps a code for tokens with the app credentials', async () => {
    const { fetcher, calls } = mockFetch(() => ({
      body: { access_token: 'a', refresh_token: 'r', expires_in: 1800 },
    }))

    await expect(
      exchangeKrogerCode({ ...CREDENTIALS, fetcher }, { code: 'c', redirectUri: 'u' }, 1000)
    ).resolves.toEqual({ accessToken: 'a', refreshToken: 'r', expiresAt: 1000 + 1800 * 1000 })

    const [call] = calls

    expect(new Headers(call?.init?.headers).get('Authorization')).toBe(
      `Basic ${btoa('id:secret')}`
    )
    expect(String(call?.init?.body)).toContain('grant_type=authorization_code')
  })

  it('keeps the old refresh token when Kroger sends no new one', async () => {
    const { fetcher } = mockFetch(() => ({ body: { access_token: 'b', expires_in: 60 } }))

    await expect(
      refreshKrogerTokens({ ...CREDENTIALS, fetcher }, 'old-refresh', 0)
    ).resolves.toEqual({ accessToken: 'b', refreshToken: 'old-refresh', expiresAt: 60_000 })
  })

  it('treats a refused refresh as needing to sign in again', async () => {
    const { fetcher } = mockFetch(() => ({ status: 400, body: { error: 'invalid_grant' } }))

    await expect(
      refreshKrogerTokens({ ...CREDENTIALS, fetcher }, 'dead', 0)
    ).rejects.toMatchObject({ code: 'GROCER_UNAVAILABLE' })
  })
})

describe('createKrogerClient app token', () => {
  it('gets a new token once the old one lapses', async () => {
    let now = 0
    const { fetcher, calls } = krogerFetch()
    const client = createKrogerClient({ ...CREDENTIALS, fetcher }, () => now)

    await client.findStores('90028')
    now = 1800 * 1000
    await client.findStores('90028')

    expect(calls.filter(({ url }) => url.includes('/oauth2/token'))).toHaveLength(2)
  })
})
