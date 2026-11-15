import { describe, expect, it } from 'vitest'

import type { AccessGrant } from './paidAccess'

import { activeGrant, grantGivesAccess, hasPaidAccess } from './paidAccess'

const NOW = new Date('2026-11-15T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const daysFromNow = (days: number): Date => new Date(NOW.getTime() + days * DAY)

const grant = (overrides: Partial<AccessGrant> = {}): AccessGrant => ({
  source: 'stripe',
  status: 'active',
  currentPeriodEnd: daysFromNow(20),
  pastDueSince: null,
  ...overrides,
})

describe('grantGivesAccess', () => {
  it.each([
    ['active', true],
    ['trialing', true],
    ['canceled', false],
    ['incomplete', false],
    ['incomplete_expired', false],
    ['unpaid', false],
    ['paused', false],
  ] as const)('%s inside the period gives access: %s', (status, expected) => {
    expect(grantGivesAccess(grant({ status }), NOW)).toBe(expected)
  })

  it('keeps an active plan on for a few days past the period end, then stops', () => {
    expect(grantGivesAccess(grant({ currentPeriodEnd: daysFromNow(-2) }), NOW)).toBe(true)
    expect(grantGivesAccess(grant({ currentPeriodEnd: daysFromNow(-4) }), NOW)).toBe(false)
  })

  it('treats an active grant with no period end as open', () => {
    expect(grantGivesAccess(grant({ currentPeriodEnd: null }), NOW)).toBe(true)
  })

  it('gives past_due a short grace window from when the charge failed', () => {
    const pastDue = (days: number): AccessGrant =>
      grant({ status: 'past_due', pastDueSince: daysFromNow(-days) })

    expect(grantGivesAccess(pastDue(1), NOW)).toBe(true)
    expect(grantGivesAccess(pastDue(2.9), NOW)).toBe(true)
    expect(grantGivesAccess(pastDue(3.1), NOW)).toBe(false)
  })

  it('refuses past_due with no failure date', () => {
    expect(grantGivesAccess(grant({ status: 'past_due' }), NOW)).toBe(false)
  })
})

describe('hasPaidAccess', () => {
  it('always lets the owner in, with or without a subscription', () => {
    expect(hasPaidAccess({ isOwner: true, grants: [], now: NOW })).toBe(true)
  })

  it('refuses a member with no grants', () => {
    expect(hasPaidAccess({ isOwner: false, grants: [], now: NOW })).toBe(false)
  })

  it('accepts a partner grant the same as a Stripe one', () => {
    const grants = [grant({ source: 'partner', currentPeriodEnd: null })]

    expect(hasPaidAccess({ isOwner: false, grants, now: NOW })).toBe(true)
  })

  it('refuses an ended partner grant', () => {
    const grants = [grant({ source: 'partner', status: 'canceled' })]

    expect(hasPaidAccess({ isOwner: false, grants, now: NOW })).toBe(false)
  })

  it('accepts when any one grant is good', () => {
    const grants = [grant({ status: 'canceled' }), grant({ source: 'partner' })]

    expect(hasPaidAccess({ isOwner: false, grants, now: NOW })).toBe(true)
  })
})

describe('activeGrant', () => {
  it('prefers the Stripe grant so billing can be managed', () => {
    const partner = grant({ source: 'partner' })
    const stripe = grant({ source: 'stripe' })

    expect(activeGrant([partner, stripe], NOW)).toBe(stripe)
  })

  it('skips grants that give no access', () => {
    const lapsed = grant({ status: 'canceled' })
    const partner = grant({ source: 'partner' })

    expect(activeGrant([lapsed, partner], NOW)).toBe(partner)
    expect(activeGrant([lapsed], NOW)).toBeUndefined()
  })
})
