import { describe, expect, it, vi } from 'vitest'

import type { GraphQLContext } from '@/graphql/context'
import type { BillingService } from '@/services'

import { SUBSCRIPTION_REQUIRED } from '@/libs/billing/subscriptionRequired'

import { BillingResolver } from './BillingResolver'

type Caller = 'signed-out' | 'member' | 'paid' | 'owner'

const USER = { id: 'user-1', email: 'cook@example.com' }

const setup = (caller: Caller) => {
  const billingService = {
    bookDownloadUrl: vi.fn().mockResolvedValue('https://r2.example/signed'),
    startCheckout: vi.fn().mockResolvedValue('https://checkout.stripe.com/c/1'),
    openBillingPortal: vi.fn().mockResolvedValue('https://billing.stripe.com/p/1'),
    getPlan: vi.fn().mockResolvedValue({
      hasPaidAccess: false,
      currentPeriodEnd: new Date('2026-12-15T00:00:00Z'),
      cancelAtPeriodEnd: false,
      canSubscribe: true,
      canManageBilling: false,
    }),
  }
  const signedIn = caller !== 'signed-out'
  const ctx = {
    authId: signedIn ? 'auth-1' : undefined,
    user: signedIn ? USER : null,
    isOwner: vi.fn().mockResolvedValue(caller === 'owner'),
    hasPaidAccess: vi.fn().mockResolvedValue(caller === 'paid' || caller === 'owner'),
  } as unknown as GraphQLContext
  const resolver = new BillingResolver(billingService as unknown as BillingService)
  return { billingService, ctx, resolver }
}

// Every paid resolver, with how to call it. Add new paid resolvers here (the meal planner, Send to
// cart) so each one is proven to refuse a member without the plan.
const PAID_RESOLVERS = [
  {
    name: 'bookDownloadUrl',
    call: (resolver: BillingResolver, ctx: GraphQLContext) => resolver.bookDownloadUrl(ctx),
    work: 'bookDownloadUrl' as const,
  },
]

describe.each(PAID_RESOLVERS)('paid resolver $name', ({ call, work }) => {
  it('asks a signed-out visitor to sign in and does no work', async () => {
    const { billingService, ctx, resolver } = setup('signed-out')

    await expect(call(resolver, ctx)).rejects.toMatchObject({
      extensions: { code: 'UNAUTHORIZED' },
    })
    expect(billingService[work]).not.toHaveBeenCalled()
  })

  it('refuses a free member with SUBSCRIPTION_REQUIRED and does no work', async () => {
    const { billingService, ctx, resolver } = setup('member')

    await expect(call(resolver, ctx)).rejects.toMatchObject({
      extensions: { code: SUBSCRIPTION_REQUIRED },
    })
    expect(billingService[work]).not.toHaveBeenCalled()
  })

  it.each(['paid', 'owner'] as const)('serves a %s caller', async (caller) => {
    const { billingService, ctx, resolver } = setup(caller)

    await expect(call(resolver, ctx)).resolves.toBeTruthy()
    expect(billingService[work]).toHaveBeenCalledTimes(1)
  })
})

describe('BillingResolver billing mutations', () => {
  it('needs a signed-in user to start checkout or open the portal', async () => {
    const { billingService, ctx, resolver } = setup('signed-out')

    await expect(resolver.startCheckout(ctx)).rejects.toMatchObject({
      extensions: { code: 'UNAUTHORIZED' },
    })
    await expect(resolver.openBillingPortal(ctx)).rejects.toMatchObject({
      extensions: { code: 'UNAUTHORIZED' },
    })
    expect(billingService.startCheckout).not.toHaveBeenCalled()
    expect(billingService.openBillingPortal).not.toHaveBeenCalled()
  })

  it('starts checkout for the signed-in user', async () => {
    const { billingService, ctx, resolver } = setup('member')

    await expect(resolver.startCheckout(ctx)).resolves.toBe('https://checkout.stripe.com/c/1')
    expect(billingService.startCheckout).toHaveBeenCalledWith(USER, false)
  })
})

describe('BillingResolver.myPlan', () => {
  it('is null when signed out', async () => {
    const { ctx, resolver } = setup('signed-out')

    await expect(resolver.myPlan(ctx)).resolves.toBeNull()
  })

  it('returns the plan with the period end as an ISO string', async () => {
    const { ctx, resolver } = setup('member')

    await expect(resolver.myPlan(ctx)).resolves.toMatchObject({
      hasPaidAccess: false,
      currentPeriodEnd: '2026-12-15T00:00:00.000Z',
    })
  })
})
