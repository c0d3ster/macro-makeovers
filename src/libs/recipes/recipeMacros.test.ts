import { describe, expect, it } from 'vitest'

import {
  formatMacroTarget,
  macroDistance,
  matchesMacroTarget,
  parseMacroTarget,
} from './recipeMacros'

describe('macro targets', () => {
  it('round-trips through the URL form', () => {
    ;['35', 'le35', 'ge45'].forEach((text) => {
      const target = parseMacroTarget(text)

      expect(target && formatMacroTarget(target)).toBe(text)
    })
  })

  it('rejects anything that is not a target', () => {
    expect(parseMacroTarget(undefined)).toBeUndefined()
    expect(parseMacroTarget('')).toBeUndefined()
    expect(parseMacroTarget('lots')).toBeUndefined()
    expect(parseMacroTarget('gt40')).toBeUndefined()
    expect(parseMacroTarget('123')).toBeUndefined()
  })

  it('matches a near target within four points either side', () => {
    const target = { kind: 'near', value: 40 } as const

    expect(matchesMacroTarget(target, 36)).toBe(true)
    expect(matchesMacroTarget(target, 44)).toBe(true)
    expect(matchesMacroTarget(target, 35)).toBe(false)
    expect(matchesMacroTarget(target, 45)).toBe(false)
  })

  it('matches open-ended targets on one side only', () => {
    expect(matchesMacroTarget({ kind: 'atMost', value: 35 }, 35)).toBe(true)
    expect(matchesMacroTarget({ kind: 'atMost', value: 35 }, 36)).toBe(false)
    expect(matchesMacroTarget({ kind: 'atLeast', value: 45 }, 45)).toBe(true)
    expect(matchesMacroTarget({ kind: 'atLeast', value: 45 }, 44)).toBe(false)
  })

  it('measures distance so lower is always closer', () => {
    expect(macroDistance({ kind: 'near', value: 40 }, 43)).toBe(3)
    expect(macroDistance({ kind: 'atMost', value: 35 }, 30)).toBeLessThan(
      macroDistance({ kind: 'atMost', value: 35 }, 34)
    )
    expect(macroDistance({ kind: 'atLeast', value: 45 }, 50)).toBeLessThan(
      macroDistance({ kind: 'atLeast', value: 45 }, 46)
    )
  })
})
