import { describe, expect, it } from 'vitest'

import robots from './robots'

describe('robots.txt', () => {
  it('should return robots.txt content', () => {
    const response = robots()

    expect(response).toBeDefined()
    expect(response.rules).toBeDefined()

    // Handle both array and object cases for rules
    if (Array.isArray(response.rules)) {
      expect(response.rules[0]?.userAgent).toBe('*')
      expect(response.rules[0]?.allow).toBe('/')
      expect(response.rules[0]?.disallow).toBe('/profile/')
    } else {
      expect(response.rules?.userAgent).toBe('*')
      expect(response.rules?.allow).toBe('/')
      expect(response.rules?.disallow).toBe('/profile/')
    }

    expect(response.sitemap).toContain('/sitemap.xml')
  })
})
