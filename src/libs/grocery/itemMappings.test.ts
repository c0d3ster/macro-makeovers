import { describe, expect, it } from 'vitest'

import { BASKET_ITEMS } from '@/libs/basket'

import { measuresFor, searchTermFor, WALMART_ITEM_IDS } from './itemMappings'

const item = (key: string) => {
  const found = BASKET_ITEMS[key]
  if (!found) throw new Error(`No basket item ${key}`)
  return found
}

describe('searchTermFor', () => {
  it('gives every basket item a clean search term', () => {
    Object.entries(BASKET_ITEMS).forEach(([key, basketItem]) => {
      const term = searchTermFor(key, basketItem)

      expect(term, key).toMatch(/^[a-z0-9' %/.-]+$/)
      expect(term, key).not.toMatch(/\s{2}|^\s|\s$/)
    })
  })

  it('puts the words after the comma first and drops the brand in brackets', () => {
    expect(searchTermFor('chicken_breast', item('chicken_breast'))).toBe(
      'boneless skinless chicken breast'
    )
    expect(searchTermFor('brown_rice', item('brown_rice'))).toBe('brown rice')
    expect(searchTermFor('black_beans', item('black_beans'))).toBe(
      'low sodium black beans'
    )
  })

  it('uses a hand-written term where the name reads badly', () => {
    expect(searchTermFor('butter', item('butter'))).toBe('salted butter sticks')
  })
})

describe('measuresFor', () => {
  const pack = (label: string, packQuantity = 1, price = 1) => ({
    pack: label,
    packQuantity,
    price,
  })

  it('goes by the pound for items priced by weight', () => {
    expect(measuresFor([], 2, 1.456)).toEqual([{ quantity: 1.46, unit: 'lb' }])
  })

  it('adds up sizes across packs, with the pack count as a fallback', () => {
    expect(
      measuresFor(
        [
          { size: pack('16 oz tub'), count: 1 },
          { size: pack('5.3 oz cup'), count: 2 },
        ],
        3
      )
    ).toEqual([
      { quantity: 26.6, unit: 'oz' },
      { quantity: 3, unit: 'package' },
    ])
  })

  it('reads counts and fluid ounces the way Instacart spells them', () => {
    expect(measuresFor([{ size: pack('12 ct'), count: 1 }], 1)[0]).toEqual({
      quantity: 12,
      unit: 'each',
    })
    expect(measuresFor([{ size: pack('14.5 fl oz can'), count: 2 }], 2)[0]).toEqual({
      quantity: 29,
      unit: 'fl oz can',
    })
    expect(measuresFor([{ size: pack('52 fl oz bottle'), count: 1 }], 1)[0]).toEqual({
      quantity: 52,
      unit: 'fl oz container',
    })
  })

  it('counts produce sold by the piece or bunch', () => {
    expect(measuresFor([{ size: pack('each'), count: 3 }], 3)).toEqual([
      { quantity: 3, unit: 'each' },
    ])
    expect(measuresFor([{ size: pack('bunch (~7)'), count: 1 }], 1)).toEqual([
      { quantity: 1, unit: 'bunch' },
    ])
  })

  it('falls back to packages when a label has no size', () => {
    expect(measuresFor([{ size: pack('head (~10 cloves)'), count: 1 }], 1)).toEqual([
      { quantity: 1, unit: 'head' },
    ])
    expect(measuresFor([{ size: pack('0.5 oz clamshell'), count: 1 }], 1)[0]).toEqual({
      quantity: 0.5,
      unit: 'oz',
    })
    expect(measuresFor([{ size: pack('clamshell'), count: 2 }], 2)).toEqual([
      { quantity: 2, unit: 'package' },
    ])
  })
})

describe('WALMART_ITEM_IDS', () => {
  it('only maps items the basket has', () => {
    Object.keys(WALMART_ITEM_IDS).forEach((key) => {
      expect(BASKET_ITEMS[key], key).toBeDefined()
    })
  })
})
