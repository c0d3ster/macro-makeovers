import { describe, expect, it, vi } from 'vitest'

import { Env } from './Env'

// Unmock the Env to test the actual implementation
vi.unmock('@/libs/Env')

describe('Env', () => {
  it('should be defined', () => {
    expect(Env).toBeDefined()
  })

  it('should be an object', () => {
    expect(typeof Env).toBe('object')
  })
})
