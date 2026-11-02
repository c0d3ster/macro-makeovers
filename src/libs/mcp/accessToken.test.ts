import { describe, expect, it } from 'vitest'

import { readBearerToken } from './accessToken'

describe('readBearerToken', () => {
  it('returns the token from a bearer header', () => {
    expect(readBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi')
  })

  it('ignores the scheme case', () => {
    expect(readBearerToken('bearer abc')).toBe('abc')
  })

  it('rejects a missing header', () => {
    expect(readBearerToken(null)).toBeUndefined()
  })

  it('rejects other schemes', () => {
    expect(readBearerToken('Basic dXNlcjpwYXNz')).toBeUndefined()
  })

  it('rejects a header with no token or extra parts', () => {
    expect(readBearerToken('Bearer')).toBeUndefined()
    expect(readBearerToken('Bearer a b')).toBeUndefined()
  })
})
