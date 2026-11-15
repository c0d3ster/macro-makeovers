import Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SubscriptionRepository, SubscriptionRow } from '@/libs/billing'
import type { EmailService } from '@/services/EmailService'

import { BillingService } from './BillingService'

const WEBHOOK_SECRET = 'whsec_test_secret'
const NOW = new Date()

const row = (overrides: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  id: 'row-1',
  userId: 'user-1',
  source: 'stripe',
  stripeCustomerId: 'cus_1',
  stripeSubscriptionId: 'sub_1',
  status: 'active',
  currentPeriodEnd: new Date(NOW.getTime() + 20 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  pastDueSince: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
})

const USER = { id: 'user-1', email: 'cook@example.com' }

const setup = (rows: SubscriptionRow[] = []) => {
  const stripe = new Stripe('sk_test_123')
  const repository = {
    findByUserId: vi.fn().mockResolvedValue(rows),
    saveCustomer: vi.fn(),
    once: vi.fn(async (_event, work) => ({
      result: await work({ findStripeRow: vi.fn(), saveStripeRow: vi.fn() }),
    })),
  }
  const createCustomer = vi
    .spyOn(stripe.customers, 'create')
    .mockResolvedValue({ id: 'cus_new' } as never)
  const createSession = vi
    .spyOn(stripe.checkout.sessions, 'create')
    .mockResolvedValue({ url: 'https://checkout.stripe.com/c/1' } as never)
  const createPortal = vi
    .spyOn(stripe.billingPortal.sessions, 'create')
    .mockResolvedValue({ url: 'https://billing.stripe.com/p/1' } as never)
  const retrieve = vi.spyOn(stripe.subscriptions, 'retrieve').mockResolvedValue({
    id: 'sub_1',
    customer: 'cus_1',
    status: 'active',
    cancel_at_period_end: false,
    cancel_at: null,
    metadata: { userId: 'user-1' },
    items: { data: [{ current_period_end: 1_800_000_000 }] },
  } as never)

  const service = new BillingService({
    repository: repository as unknown as SubscriptionRepository,
    emailService: { sendBillingEmail: vi.fn() } as unknown as EmailService,
    getStripe: () => ({
      stripe,
      config: { secretKey: 'sk_test_123', webhookSecret: WEBHOOK_SECRET, priceId: 'price_1' },
    }),
    getBookBucket: () => ({
      accountId: 'acct',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      bucket: 'book-private',
    }),
    appUrl: () => 'https://macromakeovers.com/',
  })
  return { stripe, service, repository, createCustomer, createSession, createPortal, retrieve }
}

const signed = (stripe: Stripe, payload: string, secret = WEBHOOK_SECRET): string =>
  stripe.webhooks.generateTestHeaderString({ payload, secret })

const checkoutPayload = JSON.stringify({
  id: 'evt_1',
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      object: 'checkout.session',
      mode: 'subscription',
      subscription: 'sub_1',
      client_reference_id: 'user-1',
    },
  },
})

describe('BillingService.handleWebhook', () => {
  beforeEach(() => vi.clearAllMocks())

  it('applies an event with a valid signature', async () => {
    const { stripe, service, repository, retrieve } = setup()

    await expect(
      service.handleWebhook(checkoutPayload, signed(stripe, checkoutPayload))
    ).resolves.toEqual({ status: 200, outcome: 'updated' })
    expect(retrieve).toHaveBeenCalledWith('sub_1')
    expect(repository.once).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'evt_1' }),
      expect.any(Function)
    )
  })

  it('rejects a bad signature without touching the database', async () => {
    const { stripe, service, repository } = setup()

    await expect(
      service.handleWebhook(checkoutPayload, signed(stripe, checkoutPayload, 'whsec_wrong'))
    ).resolves.toEqual({ status: 400 })
    expect(repository.once).not.toHaveBeenCalled()
  })

  it('rejects a body changed after signing', async () => {
    const { stripe, service, repository } = setup()
    const header = signed(stripe, checkoutPayload)

    await expect(
      service.handleWebhook(checkoutPayload.replace('user-1', 'user-2'), header)
    ).resolves.toEqual({ status: 400 })
    expect(repository.once).not.toHaveBeenCalled()
  })

  it('rejects a request with no signature', async () => {
    const { service } = setup()

    await expect(service.handleWebhook(checkoutPayload, null)).resolves.toEqual({
      status: 400,
    })
  })

  it('answers 500 so Stripe retries when processing fails', async () => {
    const { stripe, service, retrieve } = setup()
    retrieve.mockRejectedValueOnce(new Error('Stripe down'))

    await expect(
      service.handleWebhook(checkoutPayload, signed(stripe, checkoutPayload))
    ).resolves.toEqual({ status: 500 })
  })
})

describe('BillingService.startCheckout', () => {
  it('makes one customer and a subscription checkout tagged with the user', async () => {
    const { service, repository, createCustomer, createSession } = setup()

    await expect(service.startCheckout(USER, false)).resolves.toBe(
      'https://checkout.stripe.com/c/1'
    )
    expect(createCustomer).toHaveBeenCalledWith(
      { email: USER.email, metadata: { userId: USER.id } },
      { idempotencyKey: 'customer-user-1' }
    )
    expect(repository.saveCustomer).toHaveBeenCalledWith('user-1', 'cus_new')
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_new',
        client_reference_id: 'user-1',
        line_items: [{ price: 'price_1', quantity: 1 }],
        subscription_data: { metadata: { userId: 'user-1' } },
        success_url: 'https://macromakeovers.com/profile?checkout=success',
      })
    )
  })

  it('reuses the customer of a lapsed subscription', async () => {
    const { service, createCustomer, createSession } = setup([row({ status: 'canceled' })])

    await service.startCheckout(USER, false)

    expect(createCustomer).not.toHaveBeenCalled()
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ customer: 'cus_1' }))
  })

  it('refuses a member who already pays', async () => {
    const { service, createSession } = setup([row()])

    await expect(service.startCheckout(USER, false)).rejects.toThrow(
      'You already have the paid plan.'
    )
    expect(createSession).not.toHaveBeenCalled()
  })

  it('never shows checkout to a partner member', async () => {
    const { service, createSession } = setup([
      row({
        source: 'partner',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
      }),
    ])

    await expect(service.startCheckout(USER, false)).rejects.toThrow(/ForgeFit/)
    expect(createSession).not.toHaveBeenCalled()
  })

  it('sends a member with a failed card to the portal instead of a second subscription', async () => {
    const { service, createSession } = setup([
      row({ status: 'past_due', pastDueSince: new Date(0) }),
    ])

    await expect(service.startCheckout(USER, false)).rejects.toThrow(/Update your card/)
    expect(createSession).not.toHaveBeenCalled()
  })
})

describe('BillingService.openBillingPortal', () => {
  it('opens the portal for a Stripe customer', async () => {
    const { service, createPortal } = setup([row()])

    await expect(service.openBillingPortal(USER, false)).resolves.toBe(
      'https://billing.stripe.com/p/1'
    )
    expect(createPortal).toHaveBeenCalledWith({
      customer: 'cus_1',
      return_url: 'https://macromakeovers.com/profile',
    })
  })

  it('never opens our portal for a partner member', async () => {
    const { service, createPortal } = setup([
      row({ source: 'partner', stripeCustomerId: null, stripeSubscriptionId: null }),
    ])

    await expect(service.openBillingPortal(USER, false)).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    })
    expect(createPortal).not.toHaveBeenCalled()
  })
})

describe('BillingService.bookDownloadUrl', () => {
  it('signs a short-lived link to the private book object', async () => {
    const { service } = setup()
    const url = new URL(await service.bookDownloadUrl())

    expect(url.host).toBe('acct.r2.cloudflarestorage.com')
    expect(url.pathname).toBe('/book-private/macro-makeovers.pdf')
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300')
    expect(url.searchParams.get('X-Amz-Signature')).toBeTruthy()
    expect(url.searchParams.get('response-content-disposition')).toContain('attachment')
  })
})
