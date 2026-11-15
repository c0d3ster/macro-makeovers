import { describe, expect, it } from 'vitest'

import { formatPlanPrice } from './billingConfig'
import { billingEmailContent } from './billingEmails'

const APP = { appUrl: 'https://macromakeovers.com/', firstName: 'Sam' }

describe('billingEmailContent', () => {
  it('welcomes with what the plan includes and what stays free', () => {
    const email = billingEmailContent({ kind: 'welcome', userId: 'u' }, APP)

    expect(email.subject).toMatch(/welcome/i)
    expect(email.paragraphs[0]).toBe('Hi Sam,')
    expect(email.paragraphs.join(' ')).toMatch(/meal planner/)
    expect(email.paragraphs.join(' ')).toMatch(/stay free/)
    expect(email.link?.href).toBe('https://macromakeovers.com/profile')
  })

  it('points a failed payment at billing', () => {
    const email = billingEmailContent({ kind: 'payment_failed', userId: 'u' }, APP)

    expect(email.link).toEqual({
      label: 'Update billing',
      href: 'https://macromakeovers.com/profile',
    })
  })

  it('says when access ends on a scheduled cancellation', () => {
    const email = billingEmailContent(
      {
        kind: 'cancellation',
        userId: 'u',
        accessEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      { appUrl: APP.appUrl }
    )

    expect(email.paragraphs[0]).toBe('Hi,')
    expect(email.paragraphs[1]).toMatch(/stay on until/)
  })

  it('does not promise days left when the plan already ended', () => {
    const email = billingEmailContent(
      { kind: 'cancellation', userId: 'u', accessEndsAt: new Date(0) },
      APP
    )

    expect(email.paragraphs[1]).not.toMatch(/until/)
  })
})

describe('formatPlanPrice', () => {
  it.each([
    [undefined, '$5'],
    ['5', '$5'],
    ['3', '$3'],
    ['4.5', '$4.50'],
    ['nope', '$5'],
    ['0', '$5'],
  ])('%s shows as %s', (input, expected) => {
    expect(formatPlanPrice(input)).toBe(expected)
  })
})
