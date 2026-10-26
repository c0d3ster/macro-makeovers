// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

import { config } from './proxy'

vi.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: vi.fn(),
  createRouteMatcher: vi.fn(() => () => false),
}))

// Next compiles `matcher` with path-to-regexp; anchoring it like this is close enough to check it
const matches = (path: string): boolean => new RegExp(`^${config.matcher}$`).test(path)

describe('proxy matcher', () => {
  it('runs on pages and API routes', () => {
    ;['/', '/profile', '/profile/settings', '/api/graphql'].forEach((path) => {
      expect(matches(path)).toBe(true)
    })
  })

  it('skips Next internals, webhooks and static files', () => {
    ;['/_next/static/chunk.js', '/api/webhook/clerk', '/favicon.ico', '/robots.txt'].forEach((path) => {
      expect(matches(path)).toBe(false)
    })
  })
})
