import type Stripe from 'stripe'

import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import type {
  BillingEmail,
  StripeEventOutcome,
  StripeSetup,
  SubscriptionRepository,
  SubscriptionRow,
} from '@/libs/billing'
import type { R2Bucket } from '@/libs/photos/r2Storage'
import type { EmailService } from '@/services/EmailService'

import {
  activeGrant,
  billingEmailContent,
  handleStripeEvent,
  hasPaidAccess,
} from '@/libs/billing'
import {
  BOOK_DOWNLOAD_NAME,
  BOOK_LINK_SECONDS,
  BOOK_OBJECT_KEY,
} from '@/libs/book'
import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { presignR2Get } from '@/libs/photos/r2Storage'
import { schemas } from '@/models'

type BillingUser = { id: string; email: string }

export type PlanSummary = {
  hasPaidAccess: boolean
  // Where access comes from: stripe, partner, or owner. Unset without access.
  source?: 'stripe' | 'partner' | 'owner'
  status?: SubscriptionRow['status']
  currentPeriodEnd?: Date | null
  cancelAtPeriodEnd: boolean
  // Partner members never see our checkout or portal: their billing belongs to the partner
  canSubscribe: boolean
  canManageBilling: boolean
}

type BillingDeps = {
  repository: SubscriptionRepository
  emailService: EmailService
  getStripe: () => StripeSetup | undefined
  getBookBucket: () => R2Bucket | undefined
  appUrl: () => string
}

const OPEN_STATUSES = new Set<SubscriptionRow['status']>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
])

const isOpenInStripe = ({ stripeSubscriptionId, status }: SubscriptionRow): boolean =>
  !!stripeSubscriptionId && OPEN_STATUSES.has(status)

const PARTNER_BILLING =
  'Your plan comes through ForgeFit, so billing is handled there.'

const checkoutRefusal = ({ source, hasPaidAccess }: PlanSummary): string => {
  if (source === 'partner') return PARTNER_BILLING
  if (hasPaidAccess) return 'You already have the paid plan.'
  return 'Your last payment did not go through. Update your card from your account page.'
}

const notConfigured = (what: string): GraphQLError =>
  new GraphQLError(`${what} is not available right now. Try again later.`, {
    extensions: { code: 'BAD_USER_INPUT' },
  })

export class BillingService {
  constructor(private deps: BillingDeps) {}

  async getPlan(userId: string, isOwner: boolean): Promise<PlanSummary> {
    const grants = await this.deps.repository.findByUserId(userId)
    const grant = activeGrant(grants)
    const stripeRow = grants.find(({ source }) => source === 'stripe')
    const viaPartner = grant?.source === 'partner'

    return {
      hasPaidAccess: hasPaidAccess({ isOwner, grants }),
      source: grant?.source ?? (isOwner ? 'owner' : undefined),
      status: grant?.status ?? stripeRow?.status,
      currentPeriodEnd: grant?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: grant?.cancelAtPeriodEnd ?? false,
      // A subscription Stripe still holds open (a failed card) is fixed in the portal, not by
      // starting a second one
      canSubscribe: !grant && !isOwner && !(stripeRow && isOpenInStripe(stripeRow)),
      // A lapsed Stripe customer can still open the portal for past invoices
      canManageBilling:
        !viaPartner && !!stripeRow?.stripeCustomerId && !!stripeRow.stripeSubscriptionId,
    }
  }

  // For server-rendered pages, which know the auth id rather than the profile id
  async getPlanForAuthId(
    authId: string,
    isOwner: boolean
  ): Promise<PlanSummary | undefined> {
    const user = await db.query.users.findFirst({
      where: eq(schemas.users.authId, authId),
    })
    return user ? this.getPlan(user.id, isOwner) : undefined
  }

  // Starts Stripe Checkout for the one monthly plan and returns its URL
  async startCheckout(user: BillingUser, isOwner: boolean): Promise<string> {
    const setup = this.deps.getStripe()
    if (!setup) throw notConfigured('Checkout')

    const plan = await this.getPlan(user.id, isOwner)
    if (!plan.canSubscribe) {
      throw new GraphQLError(checkoutRefusal(plan), {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }

    const { stripe, config } = setup
    const customerId = await this.customerFor(stripe, user)
    const base = this.deps.appUrl().replace(/\/+$/, '')
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: config.priceId, quantity: 1 }],
      // Lets every later subscription event find the user without a lookup
      subscription_data: { metadata: { userId: user.id } },
      metadata: { userId: user.id },
      success_url: `${base}/profile?checkout=success`,
      cancel_url: `${base}/pricing?checkout=canceled`,
    })
    if (!session.url) throw new Error('Stripe returned a checkout session without a URL')
    return session.url
  }

  // Opens the Stripe Customer Portal: cancel, card change, and invoices
  async openBillingPortal(user: BillingUser, isOwner: boolean): Promise<string> {
    const setup = this.deps.getStripe()
    if (!setup) throw notConfigured('Billing')

    const plan = await this.getPlan(user.id, isOwner)
    const [stripeRow] = (await this.deps.repository.findByUserId(user.id)).filter(
      ({ source }) => source === 'stripe'
    )
    if (!plan.canManageBilling || !stripeRow?.stripeCustomerId) {
      throw new GraphQLError(
        plan.source === 'partner'
          ? PARTNER_BILLING
          : 'There is no billing to manage yet.',
        { extensions: { code: 'FORBIDDEN' } }
      )
    }

    const session = await setup.stripe.billingPortal.sessions.create({
      customer: stripeRow.stripeCustomerId,
      return_url: `${this.deps.appUrl().replace(/\/+$/, '')}/profile`,
    })
    return session.url
  }

  // A short-lived link to the book in the private bucket. Callers check paid access first.
  async bookDownloadUrl(): Promise<string> {
    const bucket = this.deps.getBookBucket()
    if (!bucket) throw notConfigured('The book download')
    return presignR2Get(bucket, BOOK_OBJECT_KEY, {
      expiresInSeconds: BOOK_LINK_SECONDS,
      downloadName: BOOK_DOWNLOAD_NAME,
    })
  }

  // Verifies the signature and applies the event. Returns the HTTP status for Stripe: 400 for a
  // bad signature (Stripe stops retrying), 500 when processing failed (Stripe retries).
  async handleWebhook(
    rawBody: string,
    signature: string | null
  ): Promise<{ status: number; outcome?: StripeEventOutcome }> {
    const setup = this.deps.getStripe()
    if (!setup) return { status: 503 }
    if (!signature) return { status: 400 }

    const { stripe, config } = setup
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        config.webhookSecret
      )
    } catch (error) {
      logger.warn('Stripe webhook signature rejected', { error: String(error) })
      return { status: 400 }
    }

    try {
      const outcome = await handleStripeEvent(event, {
        retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
        store: this.deps.repository,
        sendEmail: (email) => this.sendEmail(email),
      })
      logger.info('Stripe event handled', { id: event.id, type: event.type, outcome })
      return { status: 200, outcome }
    } catch (error) {
      logger.error('Stripe event failed', {
        id: event.id,
        type: event.type,
        error: String(error),
      })
      return { status: 500 }
    }
  }

  private async sendEmail(email: BillingEmail): Promise<void> {
    const user = await db.query.users.findFirst({
      where: eq(schemas.users.id, email.userId),
    })
    if (!user) return
    await this.deps.emailService.sendBillingEmail(
      user.email,
      billingEmailContent(email, { appUrl: this.deps.appUrl(), firstName: user.firstName })
    )
  }

  // One Stripe customer per user, reused across checkouts. The idempotency key stops a double
  // click from making two.
  private async customerFor(stripe: Stripe, user: BillingUser): Promise<string> {
    const [existing] = (await this.deps.repository.findByUserId(user.id)).filter(
      ({ source, stripeCustomerId }) => source === 'stripe' && stripeCustomerId
    )
    if (existing?.stripeCustomerId) return existing.stripeCustomerId

    const customer = await stripe.customers.create(
      { email: user.email, metadata: { userId: user.id } },
      { idempotencyKey: `customer-${user.id}` }
    )
    await this.deps.repository.saveCustomer(user.id, customer.id)
    return customer.id
  }
}
