import { describe, expect, it } from 'vitest'

import { HandoffError } from './groceryTypes'
import { createInstacartAdapter, INSTACART_DEVELOPMENT_URL } from './instacartAdapter'
import { mockFetch, testLine } from './testLines'

const LINK = 'https://www.instacart.com/store/shopping_lists/123'

describe('createInstacartAdapter', () => {
  it('posts the lines as a shopping list and returns its link', async () => {
    const { fetcher, calls } = mockFetch(() => ({ body: { products_link_url: LINK } }))
    const adapter = createInstacartAdapter({
      apiKey: 'key-1',
      baseUrl: INSTACART_DEVELOPMENT_URL,
      linkbackUrl: 'https://macromakeovers.com/basket',
      fetcher,
    })
    const lines = [
      testLine('cottage', {
        measures: [
          { quantity: 16, unit: 'oz' },
          { quantity: 1, unit: 'package' },
        ],
      }),
      testLine('chicken_breast', { pounds: 1.5, measures: [{ quantity: 1.5, unit: 'lb' }] }),
    ]

    const result = await adapter.handoff({ lines })

    expect(result).toEqual({ grocer: 'instacart', url: LINK, matched: lines, unmatched: [] })
    expect(calls).toHaveLength(1)
    const [call] = calls
    expect(call?.url).toBe(`${INSTACART_DEVELOPMENT_URL}/idp/v1/products/products_link`)
    expect(call?.init?.method).toBe('POST')
    expect(new Headers(call?.init?.headers).get('Authorization')).toBe('Bearer key-1')
    expect(JSON.parse(String(call?.init?.body))).toEqual({
      title: 'Macro Makeovers shopping list',
      link_type: 'shopping_list',
      line_items: [
        {
          name: 'cottage term',
          display_text: 'cottage term (1 × 16 oz tub)',
          line_item_measurements: [
            { quantity: 16, unit: 'oz' },
            { quantity: 1, unit: 'package' },
          ],
        },
        {
          name: 'chicken_breast term',
          display_text: 'chicken_breast term (1 × 16 oz tub)',
          line_item_measurements: [{ quantity: 1.5, unit: 'lb' }],
        },
      ],
      landing_page_configuration: {
        partner_linkback_url: 'https://macromakeovers.com/basket',
      },
    })
  })

  it('reuses the link while the list is unchanged', async () => {
    const { fetcher, calls } = mockFetch(() => ({ body: { products_link_url: LINK } }))
    const adapter = createInstacartAdapter({ apiKey: 'key-1', fetcher })

    await adapter.handoff({ lines: [testLine('eggs')] })
    await adapter.handoff({ lines: [testLine('eggs')] })
    await adapter.handoff({ lines: [testLine('eggs', { packCount: 2, display: '2 × 12 ct' })] })

    expect(calls).toHaveLength(2)
  })

  it('fails with a readable message when Instacart errors or sends no link', async () => {
    const failing = createInstacartAdapter({
      apiKey: 'key-1',
      fetcher: mockFetch(() => ({ status: 500, body: { error: 'boom' } })).fetcher,
    })
    const empty = createInstacartAdapter({
      apiKey: 'key-1',
      fetcher: mockFetch(() => ({ body: {} })).fetcher,
    })

    await expect(failing.handoff({ lines: [testLine('eggs')] })).rejects.toMatchObject({
      code: 'GROCER_UNAVAILABLE',
      message: expect.stringContaining('Copy the list'),
    })
    await expect(empty.handoff({ lines: [testLine('eggs')] })).rejects.toBeInstanceOf(
      HandoffError
    )
  })

  it('treats a network failure as unavailable', async () => {
    const adapter = createInstacartAdapter({
      apiKey: 'key-1',
      fetcher: async () => {
        throw new Error('offline')
      },
    })

    await expect(adapter.handoff({ lines: [testLine('eggs')] })).rejects.toMatchObject({
      code: 'GROCER_UNAVAILABLE',
    })
  })

  it('refuses an empty basket without calling Instacart', async () => {
    const { fetcher, calls } = mockFetch(() => ({ body: { products_link_url: LINK } }))
    const adapter = createInstacartAdapter({ apiKey: 'key-1', fetcher })

    await expect(adapter.handoff({ lines: [] })).rejects.toMatchObject({
      code: 'GROCER_NO_MATCHES',
    })
    expect(calls).toHaveLength(0)
  })
})
