import { describe, expect, it, vi } from 'vitest'

import { Toast } from './Toast'

// Unmock the Toast to test the actual implementation
vi.unmock('@/libs/Toast')

describe('Toast', () => {
  describe('success', () => {
    it('should have success method', () => {
      expect(typeof Toast.success).toBe('function')
    })

    it('should call success without throwing errors', () => {
      expect(() => {
        Toast.success('Success message')
      }).not.toThrow()
    })
  })

  describe('error', () => {
    it('should have error method', () => {
      expect(typeof Toast.error).toBe('function')
    })

    it('should call error without throwing errors', () => {
      expect(() => {
        Toast.error('Error message')
      }).not.toThrow()
    })
  })
})
