import { describe, expect, it, vi } from 'vitest'

import { logger } from './Logger'

// Unmock the Logger to test the actual implementation
vi.unmock('@/libs/Logger')

describe('Logger', () => {
  describe('logger methods', () => {
    it('should have error method', () => {
      expect(typeof logger.error).toBe('function')
    })

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function')
    })

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function')
    })

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function')
    })

    it('should log messages without throwing errors', () => {
      expect(() => {
        logger.error('test error')
        logger.warn('test warning')
        logger.info('test info')
        logger.debug('test debug')
      }).not.toThrow()
    })
  })
})
