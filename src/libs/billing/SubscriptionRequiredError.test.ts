import { describe, expect, it, vi } from 'vitest'

import { isSubscriptionRequired, SUBSCRIPTION_REQUIRED } from './subscriptionRequired'
import { requirePaidAccess, SubscriptionRequiredError } from './SubscriptionRequiredError'

describe('requirePaidAccess', () => {
  it('asks a signed-out caller to sign in without checking access', async () => {
    const hasPaidAccess = vi.fn()

    await expect(
      requirePaidAccess({ hasPaidAccess }, 'The book download')
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHORIZED' } })
    expect(hasPaidAccess).not.toHaveBeenCalled()
  })

  it('throws the typed error for a member without the plan', async () => {
    await expect(
      requirePaidAccess(
        { authId: 'auth-1', hasPaidAccess: vi.fn().mockResolvedValue(false) },
        'The book download'
      )
    ).rejects.toMatchObject({
      message: 'The book download comes with the paid plan.',
      extensions: { code: SUBSCRIPTION_REQUIRED, feature: 'The book download' },
    })
  })

  it('lets a paying member through', async () => {
    await expect(
      requirePaidAccess(
        { authId: 'auth-1', hasPaidAccess: vi.fn().mockResolvedValue(true) },
        'The book download'
      )
    ).resolves.toBeUndefined()
  })
})

describe('isSubscriptionRequired', () => {
  it('reads the bare GraphQL error', () => {
    expect(isSubscriptionRequired(new SubscriptionRequiredError('x'))).toBe(true)
  })

  it('reads Apollo errors in either shape', () => {
    const extensions = { code: SUBSCRIPTION_REQUIRED }

    expect(isSubscriptionRequired({ errors: [{ extensions }] })).toBe(true)
    expect(isSubscriptionRequired({ graphQLErrors: [{ extensions }] })).toBe(true)
  })

  it('ignores other errors', () => {
    expect(isSubscriptionRequired(new Error('network'))).toBe(false)
    expect(
      isSubscriptionRequired({ errors: [{ extensions: { code: 'FORBIDDEN' } }] })
    ).toBe(false)
    expect(isSubscriptionRequired(undefined)).toBe(false)
  })
})
