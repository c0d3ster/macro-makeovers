import { describe, expect, it } from 'vitest'

import { EMPTY_BASKET, parseStoredBasket, setServings } from './basketStorage'

describe('parseStoredBasket', () => {
  it('falls back to an empty basket for nothing, junk, or the wrong shape', () => {
    expect(parseStoredBasket(null)).toEqual(EMPTY_BASKET)
    expect(parseStoredBasket('not json')).toEqual(EMPTY_BASKET)
    expect(parseStoredBasket('[1, 2]')).toEqual(EMPTY_BASKET)
  })

  it('keeps known recipes once each and clamps servings', () => {
    const raw = JSON.stringify({
      entries: [
        { slug: 'spicy-turkey-chili', servings: 99 },
        { slug: 'spicy-turkey-chili', servings: 1 },
        { slug: 'gone-recipe', servings: 1 },
        { slug: 'turkey-taco-grillers' },
        'junk',
      ],
      includePantry: true,
      checked: ['pasta', 4],
    })

    // A missing count reads as the servings the recipe is written for
    expect(parseStoredBasket(raw)).toEqual({
      entries: [
        { slug: 'spicy-turkey-chili', servings: 24 },
        { slug: 'turkey-taco-grillers', servings: 4 },
      ],
      includePantry: true,
      checked: ['pasta'],
    })
  })
})

describe('setServings', () => {
  it('changes one entry and keeps the count between 1 and 24', () => {
    const entries = [
      { slug: 'a', servings: 4 },
      { slug: 'b', servings: 4 },
    ]

    expect(setServings(entries, 'b', 6)).toEqual([
      { slug: 'a', servings: 4 },
      { slug: 'b', servings: 6 },
    ])
    expect(setServings(entries, 'a', 0)[0]?.servings).toBe(1)
  })
})
