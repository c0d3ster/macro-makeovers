import { describe, expect, it } from 'vitest'

import { formatMacroRatios, toMacroRatios } from './macroRatios'

describe('toMacroRatios', () => {
  it('splits calories by 4/4/9 per gram', () => {
    // 156 + 208 + 135 = 499 kcal
    expect(toMacroRatios({ proteinG: 39, carbsG: 52, fatG: 15 })).toEqual({
      proteinPct: 31,
      carbsPct: 42,
      fatPct: 27,
    })
  })

  it('returns zeros when there are no macros', () => {
    expect(toMacroRatios({ proteinG: 0, carbsG: 0, fatG: 0 })).toEqual({
      proteinPct: 0,
      carbsPct: 0,
      fatPct: 0,
    })
  })
})

describe('formatMacroRatios', () => {
  it('always reads carbs, fat, protein', () => {
    expect(formatMacroRatios({ proteinG: 39, carbsG: 52, fatG: 15 })).toBe(
      '42 / 27 / 31'
    )
  })
})
