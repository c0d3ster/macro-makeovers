import { describe, expect, it } from 'vitest'

import { formatMinutes } from './formatMinutes'

describe('formatMinutes', () => {
  it.each([
    [15, '15 min'],
    [59, '59 min'],
    [60, '1 hr'],
    [70, '1 hr 10 min'],
    [125, '2 hr 5 min'],
  ])('%i minutes reads as %s', (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected)
  })
})
