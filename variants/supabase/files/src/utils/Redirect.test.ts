import { describe, expect, it } from 'vitest'

import { getSafeRedirectPath } from './Redirect'

describe('getSafeRedirectPath', () => {
  it('allows same-origin relative paths', () => {
    expect(getSafeRedirectPath('/dashboard?tab=1')).toBe('/dashboard?tab=1')
  })

  it('falls back when missing', () => {
    expect(getSafeRedirectPath(undefined)).toBe('/profile')
    expect(getSafeRedirectPath(null, '/')).toBe('/')
  })

  it('rejects absolute and protocol-relative URLs', () => {
    expect(getSafeRedirectPath('https://evil.com')).toBe('/profile')
    expect(getSafeRedirectPath('//evil.com')).toBe('/profile')
    expect(getSafeRedirectPath('/\\evil.com')).toBe('/profile')
  })
})
