import { describe, expect, it } from 'vitest'

import { EMPTY_BASKET, parseStoredBasket, setBatches } from './basketStorage'

describe('parseStoredBasket', () => {
  it('falls back to an empty basket for nothing, junk, or the wrong shape', () => {
    expect(parseStoredBasket(null)).toEqual(EMPTY_BASKET)
    expect(parseStoredBasket('not json')).toEqual(EMPTY_BASKET)
    expect(parseStoredBasket('[1, 2]')).toEqual(EMPTY_BASKET)
  })

  it('keeps known recipes once each and clamps batches', () => {
    const raw = JSON.stringify({
      entries: [
        { slug: 'spicy-turkey-chili', batches: 9 },
        { slug: 'spicy-turkey-chili', batches: 1 },
        { slug: 'gone-recipe', batches: 1 },
        { slug: 'turkey-taco-grillers' },
        'junk',
      ],
      includePantry: true,
      checked: ['pasta', 4],
    })

    expect(parseStoredBasket(raw)).toEqual({
      entries: [
        { slug: 'spicy-turkey-chili', batches: 3 },
        { slug: 'turkey-taco-grillers', batches: 1 },
      ],
      includePantry: true,
      checked: ['pasta'],
    })
  })
})

describe('setBatches', () => {
  it('changes one entry and keeps the count between 1 and 3', () => {
    const entries = [
      { slug: 'a', batches: 1 },
      { slug: 'b', batches: 1 },
    ]

    expect(setBatches(entries, 'b', 2)).toEqual([
      { slug: 'a', batches: 1 },
      { slug: 'b', batches: 2 },
    ])
    expect(setBatches(entries, 'a', 0)[0]?.batches).toBe(1)
  })
})
