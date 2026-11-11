import { describe, expect, it } from 'vitest'

import { buildTags, buildTitle } from './recipeBuilds'

describe('buildTitle', () => {
  it('swaps the tag word and keeps its casing', () => {
    expect(
      buildTitle('Turkey Taco Grillers', { swap: { turkey: 'beef' } })
    ).toBe('Beef Taco Grillers')
    expect(
      buildTitle('Spicy turkey chili', { swap: { turkey: 'ground beef' } })
    ).toBe('Spicy ground beef chili')
  })

  it('matches whole words only', () => {
    expect(buildTitle('Turkeyless Tacos', { swap: { turkey: 'beef' } })).toBe(
      'Turkeyless Tacos'
    )
  })

  it('uses a set title over the swap', () => {
    expect(
      buildTitle('Turkey Taco Grillers', {
        swap: { turkey: 'beef' },
        title: 'Lean Beef Taco Grillers',
      })
    ).toBe('Lean Beef Taco Grillers')
  })

  it('keeps the recipe title with no swap', () => {
    expect(buildTitle('Turkey Taco Grillers', { swap: {} })).toBe(
      'Turkey Taco Grillers'
    )
  })
})

describe('buildTags', () => {
  it('trades each swapped tag, A to Z', () => {
    expect(
      buildTags(['turkey', 'bowl', 'stovetop'], { swap: { turkey: 'beef' } })
    ).toEqual(['beef', 'bowl', 'stovetop'])
  })
})
