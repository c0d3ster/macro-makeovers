import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getBaseUrl, isServer } from './Env'

describe('Helpers', () => {
  // Snapshot/restore environment for each test to avoid cross-test bleed
  let ORIGINAL_ENV: NodeJS.ProcessEnv

  beforeEach(() => {
    ORIGINAL_ENV = { ...process.env }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  describe('getBaseUrl function', () => {
    it('should return NEXT_PUBLIC_APP_URL when set', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'

      expect(getBaseUrl()).toBe('https://example.com')
    })

    it('should return localhost when no environment variables are set', () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      delete process.env.VERCEL_ENV
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL
      delete process.env.VERCEL_URL

      expect(getBaseUrl()).toBe('http://localhost:3000')
    })
  })

  describe('isServer function', () => {
    it('should return true when running on server', () => {
      // Mock window as undefined to simulate server environment
      const originalWindow = globalThis.window

      // Use Object.defineProperty to safely mock window as undefined
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      expect(isServer()).toBe(true)

      // Restore window
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      })
    })

    it('should return false when running in browser', () => {
      // Ensure window is defined for browser environment test
      expect(isServer()).toBe(false)
    })
  })
})
