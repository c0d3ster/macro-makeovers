import { describe, expect, it } from 'vitest'

import { isAllowedRedirectUri } from './allowedClients'

describe('isAllowedRedirectUri', () => {
  it('allows a listed origin on any path', () => {
    expect(isAllowedRedirectUri('https://claude.ai/api/mcp/auth_callback')).toBe(
      true
    )
  })

  it('rejects an unlisted origin', () => {
    expect(isAllowedRedirectUri('https://evil.example/callback')).toBe(false)
  })

  it('rejects a lookalike host', () => {
    expect(isAllowedRedirectUri('https://claude.ai.evil.example/cb')).toBe(
      false
    )
  })

  it('rejects plain http and malformed values', () => {
    expect(isAllowedRedirectUri('http://claude.ai/cb')).toBe(false)
    expect(isAllowedRedirectUri('not a url')).toBe(false)
  })
})
