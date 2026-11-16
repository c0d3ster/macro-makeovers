import { describe, expect, it } from 'vitest'

import { fillLegalText, findLegalPage, LEGAL_PAGES, readLegalPage } from '.'

describe('legal pages', () => {
  it('has a filled, non-empty file with no top heading for every page', () => {
    LEGAL_PAGES.forEach(({ slug }) => {
      const text = readLegalPage(slug)

      expect(text.length).toBeGreaterThan(0)
      expect(text).not.toMatch(/^#/)
      expect(text).not.toMatch(/\{\{\w+\}\}/)
    })
  })

  it('fills the brand and links the support email', () => {
    expect(
      fillLegalText('{{brand}} by {{entity}}: {{email}}', 'Brand', 'a@b.com')
    ).toBe('Brand by c0d3ster LLC: [a@b.com](mailto:a@b.com)')
  })

  it('finds a page by slug', () => {
    expect(findLegalPage('privacy').title).toBe('Privacy policy')
  })
})
