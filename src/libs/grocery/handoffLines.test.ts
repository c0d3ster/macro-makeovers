import { describe, expect, it } from 'vitest'

import { computeBasket, recipeEntry } from '@/libs/basket'

import { toHandoffLines } from './handoffLines'

const linesFor = (includePantry: boolean) =>
  computeBasket([recipeEntry('spicy-turkey-chili')], { includePantry }).lines

describe('toHandoffLines', () => {
  it('sends what the basket would buy, line for line', () => {
    const basketLines = linesFor(false)
    const lines = toHandoffLines(basketLines)

    expect(lines.map(({ key }) => key)).toEqual(basketLines.map(({ key }) => key))

    lines.forEach((line) => {
      expect(line.packCount).toBeGreaterThan(0)
      expect(Number.isInteger(line.packCount)).toBe(true)
      expect(line.measures.length).toBeGreaterThan(0)
      expect(line.searchTerm).not.toBe('')
    })
  })

  it('leaves out checked-off items', () => {
    const basketLines = linesFor(false)
    const [first] = basketLines
    const lines = toHandoffLines(basketLines, new Set([first?.key ?? '']))

    expect(lines).toHaveLength(basketLines.length - 1)
    expect(lines.some(({ key }) => key === first?.key)).toBe(false)
  })

  it('includes pantry staples only when the pantry toggle is on', () => {
    const without = toHandoffLines(linesFor(false))
    const withPantry = toHandoffLines(linesFor(true))

    expect(withPantry.length).toBeGreaterThan(without.length)
  })

  it('rounds items priced by weight up to whole pounds for the cart', () => {
    const lines = computeBasket([recipeEntry('spicy-turkey-chili')], {
      includePantry: false,
    }).lines
    const byWeight = lines.find(({ item }) => item.pack === 'per lb')
    if (!byWeight) return
    const [line] = toHandoffLines([{ ...byWeight, quantity: 1.2 }])

    expect(line?.pounds).toBeCloseTo(1.2)
    expect(line?.packCount).toBe(2)
    expect(line?.measures).toEqual([{ quantity: 1.2, unit: 'lb' }])
  })
})
