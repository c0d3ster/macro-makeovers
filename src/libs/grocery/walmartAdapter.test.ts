import { describe, expect, it } from 'vitest'

import { testLine } from './testLines'
import { createWalmartAdapter } from './walmartAdapter'

const ITEM_IDS = { eggs: '111', milk: '222' }

describe('createWalmartAdapter', () => {
  it('builds an add-to-cart link with item ids, pack counts and the store', async () => {
    const adapter = createWalmartAdapter({ itemIds: ITEM_IDS })
    const result = await adapter.handoff({
      lines: [testLine('eggs', { packCount: 2 }), testLine('milk')],
      storeId: '5260',
    })
    const url = new URL(result.url)

    expect(url.origin + url.pathname).toBe('https://www.walmart.com/sc/cart/addToCart')
    expect(url.searchParams.get('items')).toBe('111_2,222_1')
    expect(url.searchParams.get('storeId')).toBe('5260')
    expect(result.unmatched).toEqual([])
  })

  it('returns lines without an item id as unmatched', async () => {
    const adapter = createWalmartAdapter({ itemIds: ITEM_IDS })
    const result = await adapter.handoff({ lines: [testLine('eggs'), testLine('cilantro')] })

    expect(result.matched.map(({ key }) => key)).toEqual(['eggs'])
    expect(result.unmatched.map(({ key }) => key)).toEqual(['cilantro'])
  })

  it('wraps the link in the affiliate link when one is set', async () => {
    const adapter = createWalmartAdapter({
      itemIds: ITEM_IDS,
      affiliateLink: 'https://goto.walmart.com/c/1/2/3',
    })
    const { url } = await adapter.handoff({ lines: [testLine('eggs')] })
    const wrapped = new URL(url)

    expect(wrapped.origin).toBe('https://goto.walmart.com')
    expect(wrapped.searchParams.get('u')).toBe(
      'https://www.walmart.com/sc/cart/addToCart?items=111_1'
    )
  })

  it('fails when nothing is mapped yet', async () => {
    const adapter = createWalmartAdapter({ itemIds: {} })

    await expect(adapter.handoff({ lines: [testLine('eggs')] })).rejects.toMatchObject({
      code: 'GROCER_NO_MATCHES',
    })
  })
})
