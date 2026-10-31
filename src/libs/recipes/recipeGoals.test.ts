import { describe, expect, it } from 'vitest'

import type { Goal } from './recipeGoals'

import { GOALS, resolveTarget } from './recipeGoals'

const goal = (id: string): Goal => {
  const found = GOALS.find((item) => item.id === id)
  if (!found) throw new Error(`No goal ${id}`)
  return found
}

describe('goal table', () => {
  it('lists the seven goals with Balanced first', () => {
    expect(GOALS.map(({ label }) => label)).toEqual([
      'Balanced',
      'Fat Loss',
      'Body Recomp',
      'Clean Bulk',
      'Full Bulk',
      'Carb Cycling Low',
      'Carb Cycling High',
    ])
  })

  it('puts calories in the rule where the spec does', () => {
    expect(goal('fat-loss').fit.maxCalories).toBe(550)
    expect(goal('full-bulk').fit.minCalories).toBe(600)
    expect(goal('body-recomp').fit.maxCalories).toBeUndefined()
  })

  it('scores Clean Bulk on fat and protein only, and Full Bulk on a 45 / 30 / 25 split', () => {
    expect(resolveTarget({ goal: 'clean-bulk' })?.rank).toEqual({
      fat: { kind: 'near', value: 25 },
      protein: { kind: 'near', value: 30 },
    })
    expect(resolveTarget({ goal: 'full-bulk' })?.rank).toEqual({
      carbs: { kind: 'near', value: 45 },
      fat: { kind: 'near', value: 30 },
      protein: { kind: 'near', value: 25 },
    })
  })
})

describe('resolveTarget', () => {
  it('has no target without a goal or macros', () => {
    expect(resolveTarget({})).toBeUndefined()
    expect(resolveTarget({ goal: 'nonsense' })).toBeUndefined()
  })

  it('uses the goal when one is picked, ranking by its own targets', () => {
    const target = resolveTarget({ goal: 'body-recomp' })

    expect(target?.goal).toBe(goal('body-recomp'))
    expect(target?.calories).toBe('asc')
  })

  it('lets a goal win over hand-set macros', () => {
    const target = resolveTarget({
      goal: 'balanced',
      carbs: { kind: 'near', value: 60 },
    })

    expect(target?.fit.carbs).toEqual({ kind: 'near', value: 40 })
  })

  it('builds a custom target from the macros alone', () => {
    const target = resolveTarget({ fat: { kind: 'near', value: 25 } })

    expect(target?.goal).toBeUndefined()
    expect(target?.fit).toEqual({
      carbs: undefined,
      fat: { kind: 'near', value: 25 },
      protein: undefined,
    })
    expect(target?.rank).toEqual(target?.fit)
  })
})
