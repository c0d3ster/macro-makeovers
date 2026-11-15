import type Stripe from 'stripe'

import { describe, expect, it, vi } from 'vitest'

import type {
  BillingEmail,
  StripeRowFields,
  SubscriptionStore,
  SubscriptionWriter,
} from './handleStripeEvent'
import type { SubscriptionRow } from './paidAccess'

import { handleStripeEvent } from './handleStripeEvent'

const NOW = new Date('2026-11-15T12:00:00Z')
const PERIOD_END = Math.floor(new Date('2026-12-15T12:00:00Z').getTime() / 1000)

// The subscriptions table and stripe_events in memory. `once` copies the rows first and only
// keeps the changes if the work finishes, like the real transaction.
class MemoryStore implements SubscriptionStore {
  rows: SubscriptionRow[] = []
  events = new Set<string>()

  async once<T>(
    event: { id: string },
    work: (writer: SubscriptionWriter) => Promise<T>
  ): Promise<{ result: T } | undefined> {
    if (this.events.has(event.id)) return undefined
    const draft = this.rows.map((row) => ({ ...row }))
    const result = await work(this.writer(draft))
    this.rows = draft
    this.events.add(event.id)
    return { result }
  }

  private writer(rows: SubscriptionRow[]): SubscriptionWriter {
    return {
      findStripeRow: async ({ stripeSubscriptionId, stripeCustomerId, userId }) =>
        rows.find(
          (row) =>
            row.source === 'stripe' &&
            ((stripeSubscriptionId && row.stripeSubscriptionId === stripeSubscriptionId) ||
              (stripeCustomerId && row.stripeCustomerId === stripeCustomerId) ||
              (userId && row.userId === userId))
        ),
      saveStripeRow: async (userId: string, fields: StripeRowFields) => {
        const existing = rows.find(
          (row) => row.userId === userId && row.source === 'stripe'
        )
        if (existing) {
          Object.assign(existing, fields)
          return
        }
        rows.push({
          id: `row-${rows.length + 1}`,
          userId,
          source: 'stripe',
          createdAt: NOW,
          updatedAt: NOW,
          ...fields,
        })
      },
    }
  }
}

type SubscriptionShape = {
  status?: string
  cancelAtPeriodEnd?: boolean
  userId?: string
}

const stripeSubscription = ({
  status = 'active',
  cancelAtPeriodEnd = false,
  userId = 'user-1',
}: SubscriptionShape = {}): Stripe.Subscription =>
  ({
    id: 'sub_1',
    object: 'subscription',
    customer: 'cus_1',
    status,
    cancel_at_period_end: cancelAtPeriodEnd,
    cancel_at: null,
    metadata: { userId },
    items: { data: [{ current_period_end: PERIOD_END }] },
  }) as unknown as Stripe.Subscription

let eventCount = 0
const event = (type: string, object: Record<string, unknown>): Stripe.Event =>
  ({
    id: `evt_${++eventCount}`,
    object: 'event',
    type,
    data: { object },
  }) as unknown as Stripe.Event

const checkoutCompleted = (): Stripe.Event =>
  event('checkout.session.completed', {
    object: 'checkout.session',
    mode: 'subscription',
    subscription: 'sub_1',
    client_reference_id: 'user-1',
    metadata: { userId: 'user-1' },
  })

const subscriptionEvent = (
  type: 'customer.subscription.updated' | 'customer.subscription.deleted'
): Stripe.Event => event(type, { id: 'sub_1', object: 'subscription', metadata: {} })

const paymentFailed = (): Stripe.Event =>
  event('invoice.payment_failed', {
    object: 'invoice',
    parent: {
      type: 'subscription_details',
      subscription_details: { subscription: 'sub_1', metadata: { userId: 'user-1' } },
    },
  })

const setup = (initial: SubscriptionShape = {}) => {
  const store = new MemoryStore()
  const sent: BillingEmail[] = []
  let current = stripeSubscription(initial)
  const deps = {
    store,
    retrieveSubscription: vi.fn(async () => current),
    sendEmail: vi.fn(async (email: BillingEmail) => {
      sent.push(email)
    }),
    now: () => NOW,
  }
  const setStripe = (shape: SubscriptionShape): void => {
    current = stripeSubscription(shape)
  }
  const handle = (stripeEvent: Stripe.Event) => handleStripeEvent(stripeEvent, deps)
  return { store, sent, deps, setStripe, handle }
}

describe('handleStripeEvent', () => {
  it('creates the row on checkout and sends the welcome email', async () => {
    const { store, sent, handle } = setup()

    await expect(handle(checkoutCompleted())).resolves.toBe('updated')

    expect(store.rows).toHaveLength(1)
    expect(store.rows[0]).toMatchObject({
      userId: 'user-1',
      source: 'stripe',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(PERIOD_END * 1000),
      pastDueSince: null,
    })
    expect(sent).toEqual([{ kind: 'welcome', userId: 'user-1' }])
  })

  it('fills in the row checkout start left, matched by the customer id', async () => {
    const { store, handle } = setup()
    store.rows.push({
      id: 'row-1',
      userId: 'user-1',
      source: 'stripe',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: null,
      status: 'incomplete',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      pastDueSince: null,
      createdAt: NOW,
      updatedAt: NOW,
    })

    await handle(subscriptionEvent('customer.subscription.updated'))

    expect(store.rows).toHaveLength(1)
    expect(store.rows[0]).toMatchObject({ status: 'active', stripeSubscriptionId: 'sub_1' })
  })

  it('does nothing the second time Stripe delivers the same event', async () => {
    const { store, sent, deps, handle } = setup()
    const delivery = checkoutCompleted()

    await handle(delivery)
    const rowsAfterFirst = structuredClone(store.rows)

    await expect(handle(delivery)).resolves.toBe('duplicate')

    expect(store.rows).toEqual(rowsAfterFirst)
    expect(sent).toHaveLength(1)
    expect(deps.sendEmail).toHaveBeenCalledTimes(1)
  })

  it('does not welcome twice when checkout and the update both arrive', async () => {
    const { sent, handle } = setup()

    await handle(subscriptionEvent('customer.subscription.updated'))
    await handle(checkoutCompleted())

    expect(sent.filter(({ kind }) => kind === 'welcome')).toHaveLength(1)
  })

  it('reads the current state from Stripe, so an old event cannot roll it back', async () => {
    const { store, setStripe, handle } = setup()
    await handle(checkoutCompleted())

    // The cancellation already happened in Stripe; a stale "updated" arrives after it
    setStripe({ status: 'canceled' })
    await handle(subscriptionEvent('customer.subscription.updated'))
    await handle(subscriptionEvent('customer.subscription.updated'))

    expect(store.rows[0]?.status).toBe('canceled')
  })

  it('sends one cancellation email when a cancel is scheduled, keeping access', async () => {
    const { store, sent, setStripe, handle } = setup()
    await handle(checkoutCompleted())

    setStripe({ cancelAtPeriodEnd: true })
    await handle(subscriptionEvent('customer.subscription.updated'))
    setStripe({ status: 'canceled', cancelAtPeriodEnd: true })
    await handle(subscriptionEvent('customer.subscription.deleted'))

    const cancellations = sent.filter(({ kind }) => kind === 'cancellation')

    expect(cancellations).toEqual([
      {
        kind: 'cancellation',
        userId: 'user-1',
        accessEndsAt: new Date(PERIOD_END * 1000),
      },
    ])
    expect(store.rows[0]?.status).toBe('canceled')
  })

  it('sends a cancellation email ending now when cancelled outright', async () => {
    const { sent, setStripe, handle } = setup()
    await handle(checkoutCompleted())

    setStripe({ status: 'canceled' })
    await handle(subscriptionEvent('customer.subscription.deleted'))

    expect(sent.at(-1)).toEqual({ kind: 'cancellation', userId: 'user-1', accessEndsAt: NOW })
  })

  it('marks a failed payment past due, starts the grace window, and emails', async () => {
    const { store, sent, setStripe, handle } = setup()
    await handle(checkoutCompleted())

    setStripe({ status: 'past_due' })
    await handle(paymentFailed())

    expect(store.rows[0]).toMatchObject({ status: 'past_due', pastDueSince: NOW })
    expect(sent.at(-1)).toEqual({ kind: 'payment_failed', userId: 'user-1' })
  })

  it('keeps the grace window start through a second failed retry', async () => {
    const { store, setStripe, handle, deps } = setup({ status: 'past_due' })
    await handle(paymentFailed())

    deps.now = () => new Date(NOW.getTime() + 60_000)
    await handle(paymentFailed())

    expect(store.rows[0]?.pastDueSince).toEqual(NOW)

    setStripe({ status: 'active' })
    await handle(subscriptionEvent('customer.subscription.updated'))

    expect(store.rows[0]?.pastDueSince).toBeNull()
  })

  it('does not welcome a member whose card recovered', async () => {
    const { sent, setStripe, handle } = setup({ status: 'past_due' })
    await handle(paymentFailed())

    setStripe({ status: 'active' })
    await handle(subscriptionEvent('customer.subscription.updated'))

    expect(sent.map(({ kind }) => kind)).toEqual(['payment_failed'])
  })

  it('ignores events it does not handle and one-time checkouts', async () => {
    const { store, deps, handle } = setup()

    await expect(handle(event('customer.created', { id: 'cus_1' }))).resolves.toBe('ignored')
    await expect(
      handle(event('checkout.session.completed', { mode: 'payment', subscription: null }))
    ).resolves.toBe('ignored')

    expect(deps.retrieveSubscription).not.toHaveBeenCalled()
    expect(store.rows).toHaveLength(0)
  })

  it('records but does not apply a subscription that matches no user', async () => {
    const { store, sent, handle } = setup({ userId: '' })

    await expect(handle(subscriptionEvent('customer.subscription.updated'))).resolves.toBe(
      'unmatched'
    )
    expect(store.rows).toHaveLength(0)
    expect(sent).toHaveLength(0)
  })

  it('leaves a partner grant alone', async () => {
    const { store, handle, setStripe } = setup()
    store.rows.push({
      id: 'partner-1',
      userId: 'user-1',
      source: 'partner',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      pastDueSince: null,
      createdAt: NOW,
      updatedAt: NOW,
    })

    await handle(checkoutCompleted())
    setStripe({ status: 'canceled' })
    await handle(subscriptionEvent('customer.subscription.deleted'))

    expect(store.rows.find(({ source }) => source === 'partner')?.status).toBe('active')
  })

  it('still applies the event when an email fails to send', async () => {
    const { store, deps, handle } = setup()
    deps.sendEmail.mockRejectedValueOnce(new Error('Resend down'))

    await expect(handle(checkoutCompleted())).resolves.toBe('updated')
    expect(store.rows[0]?.status).toBe('active')
  })

  it('rolls back and lets Stripe retry when Stripe cannot be read', async () => {
    const { store, deps, handle } = setup()
    deps.retrieveSubscription.mockRejectedValueOnce(new Error('Stripe down'))
    const delivery = checkoutCompleted()

    await expect(handle(delivery)).rejects.toThrow('Stripe down')
    expect(store.events.has(delivery.id)).toBe(false)

    await expect(handle(delivery)).resolves.toBe('updated')
  })
})
