import { describe, expect, it } from 'vitest'

import type { Goal } from './recipeGoals'

import { detectGoal, GOALS } from './recipeGoals'

const goal = (id: string): Goal => {
  const found = GOALS.find((item) => item.id === id)
  if (!found) throw new Error(`No goal ${id}`)
  return found
}

describe('detectGoal', () => {
  it('finds nothing when no goal field is set', () => {
    expect(detectGoal({})).toBeUndefined()
  })

  it('recognizes every preset from its own fields', () => {
    GOALS.forEach((preset) => {
      expect(detectGoal(preset)).toBe(preset)
    })
  })

  it('reads as custom once a selector is edited', () => {
    const recomp = goal('body-recomp')

    expect(detectGoal({ ...recomp, fat: { kind: 'near', value: 30 } })).toBe(
      'custom'
    )
    expect(detectGoal({ ...recomp, maxCalories: 550 })).toBe('custom')
  })

  it('tells Recomp and Fat loss apart by the calorie cap and protein', () => {
    expect(detectGoal(goal('fat-loss'))).toBe(goal('fat-loss'))
    expect(detectGoal(goal('body-recomp'))).toBe(goal('body-recomp'))
  })

  it('treats a lone macro target as custom unless it is a carb cycling day', () => {
    expect(detectGoal({ carbs: { kind: 'near', value: 40 } })).toBe('custom')
    expect(detectGoal({ carbs: { kind: 'atMost', value: 35 } })).toBe(
      goal('carb-cycling-low')
    )
  })
})

describe('goal table', () => {
  it('names the six goals in the order the dropdown lists them', () => {
    expect(GOALS.map(({ label }) => label)).toEqual([
      'Fat Loss',
      'Body Recomp',
      'Clean Bulk',
      'Full Bulk',
      'Carb Cycling Low',
      'Carb Cycling High',
    ])
  })

  it('gives Full Bulk a 50 / 25 / 25 split and a 500 calorie surplus note', () => {
    const full = goal('full-bulk')

    expect([full.carbs, full.fat, full.protein]).toEqual([
      { kind: 'near', value: 50 },
      { kind: 'near', value: 25 },
      { kind: 'near', value: 25 },
    ])
    expect(full.note).toMatch(/500 calorie surplus/)
  })
})
