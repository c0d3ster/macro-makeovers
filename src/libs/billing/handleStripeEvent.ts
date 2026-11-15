import type Stripe from 'stripe'

import { logger } from '@/libs/Logger'

import type { SubscriptionRow } from './paidAccess'
import type { StripeSubscriptionFields } from './stripeSubscription'

import { grantGivesAccess } from './paidAccess'
import { idOf, toSubscriptionFields } from './stripeSubscription'

export type BillingEmail =
  | { kind: 'welcome'; userId: string }
  | { kind: 'payment_failed'; userId: string }
  | { kind: 'cancellation'; userId: string; accessEndsAt: Date | null }

export type StripeRowFields = StripeSubscriptionFields & {
  pastDueSince: Date | null
}

type RowLookup = {
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  userId?: string
}

// What the handler needs from the database, inside the event's transaction
export type SubscriptionWriter = {
  findStripeRow: (lookup: RowLookup) => Promise<SubscriptionRow | undefined>
  saveStripeRow: (userId: string, fields: StripeRowFields) => Promise<void>
}

export type SubscriptionStore = {
  // Runs `work` once per Stripe event id, in one transaction with the record of the event.
  // Returns undefined, without running it, when the event was already handled.
  once: <T>(
    event: { id: string; type: string },
    work: (writer: SubscriptionWriter) => Promise<T>
  ) => Promise<{ result: T } | undefined>
}

type StripeEventDeps = {
  retrieveSubscription: (id: string) => Promise<Stripe.Subscription>
  store: SubscriptionStore
  sendEmail: (email: BillingEmail) => Promise<void>
  now?: () => Date
}

export type StripeEventOutcome =
  | 'ignored'
  | 'duplicate'
  | 'unmatched'
  | 'updated'

type SubscriptionRef = { subscriptionId: string; userId?: string }

// Which subscription an event is about, and the user id we put on it at checkout
const subscriptionRefOf = (event: Stripe.Event): SubscriptionRef | undefined => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const subscriptionId = idOf(session.subscription)
      if (session.mode !== 'subscription' || !subscriptionId) return undefined
      return {
        subscriptionId,
        userId:
          session.client_reference_id ?? session.metadata?.userId ?? undefined,
      }
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      return {
        subscriptionId: subscription.id,
        userId: subscription.metadata?.userId,
      }
    }
    case 'invoice.payment_failed': {
      const details = event.data.object.parent?.subscription_details
      const subscriptionId = idOf(details?.subscription)
      if (!subscriptionId) return undefined
      return { subscriptionId, userId: details?.metadata?.userId }
    }
    default:
      return undefined
  }
}

const isPaying = (row: SubscriptionRow | undefined, now: Date): boolean =>
  !!row && grantGivesAccess(row, now)

const pastDueSince = (
  existing: SubscriptionRow | undefined,
  fields: StripeSubscriptionFields,
  now: Date
): Date | null => {
  if (fields.status !== 'past_due') return null
  return existing?.status === 'past_due' ? (existing.pastDueSince ?? now) : now
}

// Emails follow from the change in the row, not the event type, so events arriving out of
// order or twice cannot send one twice
const emailsFor = (
  event: Stripe.Event,
  userId: string,
  existing: SubscriptionRow | undefined,
  next: StripeRowFields,
  now: Date
): BillingEmail[] => {
  const emails: BillingEmail[] = []
  const wasPaying = isPaying(existing, now)
  const nowPaying = next.status === 'active' || next.status === 'trialing'

  // A first payment, or a return after cancelling. Recovering from past_due is not a welcome.
  if (nowPaying && !wasPaying && existing?.status !== 'past_due') {
    emails.push({ kind: 'welcome', userId })
  }

  if (event.type === 'invoice.payment_failed') {
    emails.push({ kind: 'payment_failed', userId })
  }

  const scheduledCancel = next.cancelAtPeriodEnd && !existing?.cancelAtPeriodEnd
  const endedNow =
    next.status === 'canceled' &&
    existing?.status !== 'canceled' &&
    !existing?.cancelAtPeriodEnd
  if (scheduledCancel || endedNow) {
    emails.push({
      kind: 'cancellation',
      userId,
      accessEndsAt: endedNow ? now : next.currentPeriodEnd,
    })
  }

  return emails
}

// Applies one verified Stripe event to the subscriptions table. Every handled event re-reads the
// subscription from Stripe, so the row always matches Stripe's current state whatever order
// events arrive in. Emails go out after the transaction commits; a failed send is logged and
// never makes Stripe retry the event.
export const handleStripeEvent = async (
  event: Stripe.Event,
  { retrieveSubscription, store, sendEmail, now = () => new Date() }: StripeEventDeps
): Promise<StripeEventOutcome> => {
  const ref = subscriptionRefOf(event)
  if (!ref) return 'ignored'

  const subscription = await retrieveSubscription(ref.subscriptionId)
  const fields = toSubscriptionFields(subscription)
  const at = now()

  const outcome = await store.once(event, async (writer) => {
    const existing =
      (await writer.findStripeRow({
        stripeSubscriptionId: fields.stripeSubscriptionId,
      })) ??
      (await writer.findStripeRow({ stripeCustomerId: fields.stripeCustomerId }))
    const userId =
      existing?.userId ?? ref.userId ?? subscription.metadata?.userId
    if (!userId) return { emails: [], matched: false }

    const next: StripeRowFields = {
      ...fields,
      pastDueSince: pastDueSince(existing, fields, at),
    }
    // Read the change before saving, since the save may update `existing` in place
    const emails = emailsFor(event, userId, existing, next, at)
    await writer.saveStripeRow(userId, next)
    return { emails, matched: true }
  })

  if (!outcome) return 'duplicate'
  if (!outcome.result.matched) {
    logger.error('Stripe event matches no user', {
      eventId: event.id,
      type: event.type,
      subscriptionId: ref.subscriptionId,
    })
    return 'unmatched'
  }

  for (const email of outcome.result.emails) {
    await sendEmail(email).catch((error: unknown) =>
      logger.error('Billing email failed', {
        kind: email.kind,
        eventId: event.id,
        error: String(error),
      })
    )
  }
  return 'updated'
}
