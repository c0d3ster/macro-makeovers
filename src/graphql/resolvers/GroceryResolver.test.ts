import { describe, expect, it, vi } from 'vitest'

import type { GraphQLContext } from '@/graphql/context'
import type { SendBasketInput } from '@/graphql/schema'
import type { GroceryService } from '@/services'

import { Grocer } from '@/graphql/schema'
import { GroceryError } from '@/services/GroceryError'

import { GroceryResolver } from './GroceryResolver'

const INPUT: SendBasketInput = {
  grocer: Grocer.Instacart,
  entries: [{ slug: 'spicy-turkey-chili', servings: 4 }],
  includePantry: false,
  checked: [],
}

const setup = ({ signedIn, paid }: { signedIn: boolean; paid: boolean }) => {
  const send = vi.fn().mockResolvedValue({ url: 'https://example.com' })
  const getOptions = vi.fn().mockResolvedValue({ enabled: true })
  const resolver = new GroceryResolver({ send, getOptions } as unknown as GroceryService)
  const ctx = {
    user: signedIn ? { id: 'user-1' } : undefined,
    // Until PRD 01 lands, paid access is the owner check behind checkPaidAccess
    isOwner: vi.fn().mockResolvedValue(paid),
  } as unknown as GraphQLContext
  return { send, getOptions, resolver, ctx }
}

// Drizzle bypasses RLS, so this gate is the access control for Send to cart
describe('GroceryResolver.sendBasketToGrocer', () => {
  it('refuses signed-out visitors and sends nothing', async () => {
    const { send, resolver, ctx } = setup({ signedIn: false, paid: false })

    await expect(resolver.sendBasketToGrocer(INPUT, ctx)).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    })
    expect(send).not.toHaveBeenCalled()
  })

  it('refuses members without paid access with a typed error', async () => {
    const { send, resolver, ctx } = setup({ signedIn: true, paid: false })

    await expect(resolver.sendBasketToGrocer(INPUT, ctx)).rejects.toMatchObject({
      extensions: { code: 'SUBSCRIPTION_REQUIRED' },
    })
    expect(send).not.toHaveBeenCalled()
  })

  it('sends for paid members', async () => {
    const { send, resolver, ctx } = setup({ signedIn: true, paid: true })

    await expect(resolver.sendBasketToGrocer(INPUT, ctx)).resolves.toEqual({
      url: 'https://example.com',
    })
    expect(send).toHaveBeenCalledWith('user-1', INPUT)
  })

  it('passes a grocer failure on with its code and message', async () => {
    const { send, resolver, ctx } = setup({ signedIn: true, paid: true })
    send.mockRejectedValue(new GroceryError('GROCER_AUTH_REQUIRED', 'Connect Kroger.'))

    await expect(resolver.sendBasketToGrocer(INPUT, ctx)).rejects.toMatchObject({
      message: 'Connect Kroger.',
      extensions: { code: 'GROCER_AUTH_REQUIRED' },
    })
  })
})

describe('GroceryResolver.groceryHandoffOptions', () => {
  it('answers free members too, flagged as not paid, so the upgrade prompt shows', async () => {
    const { getOptions, resolver, ctx } = setup({ signedIn: true, paid: false })

    await resolver.groceryHandoffOptions(ctx)

    expect(getOptions).toHaveBeenCalledWith({ userId: 'user-1', hasPaidAccess: false })
  })
})
