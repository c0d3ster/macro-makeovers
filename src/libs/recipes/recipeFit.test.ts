import { describe, expect, it } from 'vitest'

import type { RecipeCard } from './recipeCards'

import { distanceToTarget, evaluateFit } from './recipeFit'
import { resolveTarget } from './recipeGoals'

const card = (overrides: Partial<RecipeCard>): RecipeCard => ({
  slug: 'a',
  title: 'A',
  summary: 'A summary',
  servings: 4,
  totalMinutes: 30,
  costTier: 2,
  difficulty: 2,
  tags: [],
  calories: 500,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  ...overrides,
})

// Grams that give these shares of macro calories on a 1000 calorie base
const shares = (
  carbs: number,
  fat: number,
  protein: number
): Pick<RecipeCard, 'carbsG' | 'fatG' | 'proteinG'> => ({
  carbsG: carbs * 2.5,
  fatG: (fat * 10) / 9,
  proteinG: protein * 2.5,
})

const target = (goal: string): NonNullable<ReturnType<typeof resolveTarget>> => {
  const found = resolveTarget({ goal })
  if (!found) throw new Error(`No goal ${goal}`)
  return found
}

describe('evaluateFit', () => {
  const reasons = (fit: ReturnType<typeof evaluateFit>): string[] => fit.reasons

  it('is a good fit inside the window on every scored macro', () => {
    expect(evaluateFit(card(shares(41, 29, 30)), target('balanced'))).toEqual({
      isFit: true,
      reasons: [],
    })
  })

  it('names the macro that is off, and which way', () => {
    expect(
      reasons(evaluateFit(card(shares(40, 40, 20)), target('balanced')))
    ).toEqual(['High fat for this goal', 'Low protein for this goal'])
    expect(
      reasons(evaluateFit(card(shares(25, 30, 45)), target('balanced')))
    ).toEqual(['Low carbs for this goal', 'High protein for this goal'])
  })

  it('leads with the macro that is furthest off', () => {
    // 48 / 22 / 30 against 40 / 30 / 30 is 8 high on carbs and 8 low on fat, so the tie
    // keeps carbs first
    expect(
      reasons(evaluateFit(card(shares(48, 22, 30)), target('balanced')))
    ).toEqual(['High carbs for this goal', 'Low fat for this goal'])
    // Here fat is 10 off and carbs only 6, and protein is 4 off so it is still inside the window
    expect(
      reasons(evaluateFit(card(shares(34, 40, 26)), target('balanced')))
    ).toEqual(['High fat for this goal', 'Low carbs for this goal'])
  })

  it('counts a calorie ceiling as part of the match and lists it first', () => {
    const heavy = card({ calories: 600, ...shares(40, 25, 35) })

    expect(evaluateFit(heavy, target('fat-loss'))).toEqual({
      isFit: false,
      reasons: ['Over 550 cal'],
    })
    expect(
      reasons(
        evaluateFit(card({ calories: 600, ...shares(50, 25, 25) }), target('fat-loss'))
      )
    ).toEqual(['Over 550 cal', 'High carbs for this goal', 'Low protein for this goal'])
  })

  it('counts a calorie floor as part of the match, with no ratio window', () => {
    expect(
      evaluateFit(card({ calories: 650, ...shares(20, 60, 20) }), target('full-bulk'))
    ).toEqual({ isFit: true, reasons: [] })
    expect(
      reasons(evaluateFit(card({ calories: 550 }), target('full-bulk')))
    ).toEqual(['Under 600 cal'])
  })

  it('accepts any carbs at 40 or above for Clean Bulk', () => {
    expect(evaluateFit(card(shares(48, 25, 27)), target('clean-bulk')).isFit).toBe(
      true
    )
    // Protein is 9 over its target and carbs 4 under the floor, so protein leads
    expect(
      reasons(evaluateFit(card(shares(36, 25, 39)), target('clean-bulk')))
    ).toEqual(['High protein for this goal', 'Low carbs for this goal'])
  })

  it('treats carb cycling days as a ceiling and a floor', () => {
    expect(
      evaluateFit(card(shares(34, 33, 33)), target('carb-cycling-low')).isFit
    ).toBe(true)
    expect(
      reasons(evaluateFit(card(shares(36, 31, 33)), target('carb-cycling-low')))
    ).toEqual(['High carbs for this goal'])
    expect(
      evaluateFit(card(shares(48, 22, 30)), target('carb-cycling-high')).isFit
    ).toBe(true)
  })

  it('talks about "your targets" for hand-set macros', () => {
    const custom = resolveTarget({ fat: { kind: 'near', value: 25 } })

    expect(
      custom && reasons(evaluateFit(card(shares(30, 45, 25)), custom))
    ).toEqual(['High fat for your targets'])
  })
})

describe('distanceToTarget', () => {
  it('sums how far each ranked macro is from its target', () => {
    // 45 / 25 / 30 against a 40 / 30 / 30 target is 5 + 5 + 0 off
    expect(
      distanceToTarget(card(shares(45, 25, 30)), target('balanced'))
    ).toBe(10)
  })

  it('ignores the macros a goal does not score', () => {
    // Clean Bulk scores fat and protein only: fat is on 25, protein is 5 under 30, and the
    // carbs at 50 add nothing
    expect(
      distanceToTarget(card(shares(50, 25, 25)), target('clean-bulk'))
    ).toBe(5)
  })

  it('prefers lower carbs for a ceiling and higher carbs for a floor', () => {
    const low = target('carb-cycling-low')
    const high = target('carb-cycling-high')

    expect(distanceToTarget(card(shares(30, 40, 30)), low)).toBeLessThan(
      distanceToTarget(card(shares(34, 36, 30)), low)
    )
    expect(distanceToTarget(card(shares(50, 20, 30)), high)).toBeLessThan(
      distanceToTarget(card(shares(46, 24, 30)), high)
    )
  })
})
