import { describe, expect, it } from 'vitest'

import { isZip, pickDefaultGrocer } from './defaultGrocer'

describe('pickDefaultGrocer', () => {
  const all = ['kroger', 'walmart', 'instacart'] as const

  it('keeps the member’s last grocer', () => {
    expect(pickDefaultGrocer({ available: [...all], remembered: 'instacart' })).toBe(
      'instacart'
    )
  })

  it('ignores a remembered grocer that is no longer offered', () => {
    expect(pickDefaultGrocer({ available: ['walmart'], remembered: 'kroger' })).toBe(
      'walmart'
    )
  })

  it('picks Kroger pickup when a store is near, else Walmart pickup', () => {
    expect(pickDefaultGrocer({ available: [...all], krogerNearby: true })).toBe('kroger')
    expect(pickDefaultGrocer({ available: [...all], krogerNearby: false })).toBe('walmart')
  })

  it('never makes Instacart the default', () => {
    expect(pickDefaultGrocer({ available: ['instacart'], krogerNearby: true })).toBeUndefined()
    expect(pickDefaultGrocer({ available: ['kroger', 'instacart'] })).toBeUndefined()
  })
})

describe('isZip', () => {
  it('takes 5 digits only', () => {
    expect(isZip('45202')).toBe(true)
    expect(isZip('4520')).toBe(false)
    expect(isZip('45202-1234')).toBe(false)
  })
})
