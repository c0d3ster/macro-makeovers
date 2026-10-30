import { describe, expect, it } from 'vitest'

import { groupIngredients, scaleIngredient } from './ingredients'

describe('scaleIngredient', () => {
  it('returns the line untouched at the base serving size', () => {
    expect(scaleIngredient('1/3 cup soy sauce', 1)).toBe('1/3 cup soy sauce')
  })

  it.each([
    ['2 tbsp brown sugar', 2, '4 tbsp brown sugar'],
    ['1.5 lb ribeye strips', 2, '3 lb ribeye strips'],
    ['1/3 cup low-sodium soy sauce', 3, '1 cup low-sodium soy sauce'],
    ['1/2 onion, diced', 3, '1 1/2 onion, diced'],
    ['1 1/3 cups rice, uncooked', 1.5, '2 cups rice, uncooked'],
    ['60g fresh basil leaves', 0.5, '30g fresh basil leaves'],
    ['1 tsp salt', 1 / 3, '1/3 tsp salt'],
  ])('scales "%s" by %s', (raw, factor, expected) => {
    expect(scaleIngredient(raw, factor)).toBe(expected)
  })

  it('scales both ends of a range', () => {
    expect(scaleIngredient('3-4 tbsp buttermilk', 2)).toBe(
      '6-8 tbsp buttermilk'
    )
    expect(scaleIngredient('1/2 to 1 habanero', 2)).toBe('1 to 2 habanero')
    expect(scaleIngredient('1–1.5 tbsp lemon pepper', 2)).toBe(
      '2–3 tbsp lemon pepper'
    )
  })

  it('keeps the approximate marker', () => {
    expect(scaleIngredient('~4 tbsp reserved pasta water', 2)).toBe(
      '~8 tbsp reserved pasta water'
    )
  })

  it('leaves lines without a leading quantity alone', () => {
    expect(scaleIngredient('Salt, pepper', 2)).toBe('Salt, pepper')
    expect(scaleIngredient('Juice of 1/2 lemon', 2)).toBe('Juice of 1/2 lemon')
  })

  it('only changes the leading quantity of a long line', () => {
    expect(scaleIngredient('1/2 cup panko, for a crispy top', 2)).toBe(
      '1 cup panko, for a crispy top'
    )
  })

  it('rounds awkward results to one decimal, or a whole number from 10 up', () => {
    expect(scaleIngredient('1 lb chicken', 1.2)).toBe('1.2 lb chicken')
    expect(scaleIngredient('7 oz cheese', 1.6)).toBe('11 oz cheese')
  })
})

describe('groupIngredients', () => {
  it('groups lines by heading in first-seen order', () => {
    const groups = groupIngredients([
      { group: 'Marinade', raw: '2 tbsp sugar' },
      { group: 'Beef', raw: '1 lb beef' },
      { group: 'Marinade', raw: '1 tsp ginger' },
    ])

    expect(groups.map(({ name }) => name)).toEqual(['Marinade', 'Beef'])
    expect(groups[0]?.ingredients).toHaveLength(2)
  })

  it('keeps ungrouped lines together without a heading', () => {
    const groups = groupIngredients([{ raw: 'Salt' }, { raw: 'Pepper' }])

    expect(groups).toEqual([
      { name: undefined, ingredients: [{ raw: 'Salt' }, { raw: 'Pepper' }] },
    ])
  })
})
