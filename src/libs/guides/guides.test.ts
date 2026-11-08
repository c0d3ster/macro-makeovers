import { describe, expect, it } from 'vitest'

import {
  composeBookGuide,
  composeBookOutro,
  findGuide,
  GUIDES,
  loadBookGuideProse,
  readAbout,
  readGuide,
} from './guides'

describe('guides', () => {
  it('has a non-empty file for every guide and the about page', () => {
    GUIDES.forEach(({ slug }) =>
      expect(readGuide(slug).length).toBeGreaterThan(0)
    )

    expect(readAbout().length).toBeGreaterThan(0)
  })

  it('finds a guide by slug and nothing for an unknown one', () => {
    expect(findGuide('nutrition')?.title).toBe('Nutrition guide')
    expect(findGuide('missing')).toBeUndefined()
  })

  it('keeps guide files free of a top heading, since the page and the book add their own', () => {
    GUIDES.forEach(({ slug }) => expect(readGuide(slug)).not.toMatch(/^#/))
  })
})

describe('book prose', () => {
  it('puts the reading guide under its book heading', () => {
    expect(composeBookGuide('Body')).toBe('## How to read the recipes\n\nBody')
  })

  it('stitches the closing sections in book order with the nutrition anchor', () => {
    const outro = composeBookOutro({
      shopping: 'SHOP',
      nutrition: 'NUTRITION',
      about: 'ABOUT',
    })

    expect(outro).toBe(
      [
        '## Second Helpings',
        '### Shopping tips',
        'SHOP',
        '<a id="nutritional-foundation"></a>',
        '### Nutritional Foundation',
        'NUTRITION',
        'ABOUT',
      ].join('\n\n')
    )
  })

  it('builds both book sections from the guide files', () => {
    const { guide, outro } = loadBookGuideProse()

    expect(guide).toContain(readGuide('reading-recipes'))
    expect(outro).toContain(readGuide('shopping'))
    expect(outro).toContain(readGuide('nutrition'))
    expect(outro).toContain(readAbout())
  })
})
