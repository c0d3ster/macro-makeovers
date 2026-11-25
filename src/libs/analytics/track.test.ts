import { track as vercelTrack } from '@vercel/analytics'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ANALYTICS_EVENTS,
  FUNNEL_EVENTS,
  isAnalyticsEvent,
  toEventProperties,
} from './funnelEvents'
import { track } from './track'

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }))

describe('funnel events', () => {
  it('lists the PRD 05 phase 1 funnel in order', () => {
    expect(FUNNEL_EVENTS).toEqual([
      'visit',
      'recipe_view',
      'sign_up',
      'profile_completed',
      'plan_created',
      'upgrade_prompt_seen',
      'checkout_started',
      'subscription_active',
      'subscription_canceled',
    ])
  })

  it('has no duplicate names', () => {
    expect(new Set(ANALYTICS_EVENTS).size).toBe(ANALYTICS_EVENTS.length)
  })

  it('recognizes only known event names', () => {
    expect(isAnalyticsEvent('checkout_started')).toBe(true)
    expect(isAnalyticsEvent('Checkout Started')).toBe(false)
  })
})

describe('toEventProperties', () => {
  it('drops undefined values', () => {
    expect(toEventProperties({ slug: 'tacos', build: undefined })).toEqual({
      slug: 'tacos',
    })
  })

  it('keeps null, false, and zero', () => {
    expect(toEventProperties({ a: null, b: false, c: 0 })).toEqual({
      a: null,
      b: false,
      c: 0,
    })
  })

  it('returns undefined when nothing is left', () => {
    expect(toEventProperties({ build: undefined })).toBeUndefined()
    expect(toEventProperties(undefined)).toBeUndefined()
  })
})

describe('track', () => {
  beforeEach(() => {
    vi.mocked(vercelTrack).mockReset()
  })

  it('sends the event name and its properties to Vercel', () => {
    track('recipe_view', { slug: 'smash-burgers' })

    expect(vercelTrack).toHaveBeenCalledWith('recipe_view', {
      slug: 'smash-burgers',
    })
  })

  it('sends an event that takes no properties', () => {
    track('profile_completed')

    expect(vercelTrack).toHaveBeenCalledWith('profile_completed', undefined)
  })

  it('leaves out properties that were not set', () => {
    track('basket_add', {
      slug: 'tacos',
      build: undefined,
      placement: 'card',
    })

    expect(vercelTrack).toHaveBeenCalledWith('basket_add', {
      slug: 'tacos',
      placement: 'card',
    })
  })

  it('never throws when Vercel fails', () => {
    vi.mocked(vercelTrack).mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(() => track('visit', { source: 'direct', path: '/' })).not.toThrow()
  })
})
