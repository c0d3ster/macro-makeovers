import type Stripe from 'stripe'

import type { SubscriptionRow } from './paidAccess'

export type SubscriptionStatus = SubscriptionRow['status']

const KNOWN_STATUSES: SubscriptionStatus[] = [
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
]

// The fields a Stripe subscription sets on its row
export type StripeSubscriptionFields = {
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

export const idOf = (
  value: string | { id: string } | null | undefined
): string | undefined => (typeof value === 'string' ? value : value?.id)

// A status Stripe adds later is stored as incomplete, which gives no access, rather than failing
const toStatus = (status: string): SubscriptionStatus =>
  KNOWN_STATUSES.find((known) => known === status) ?? 'incomplete'

// The period end lives on the subscription items in current Stripe API versions. With one price
// there is one item; the latest end covers any future multi-item plan.
const periodEnd = (subscription: Stripe.Subscription): Date | null => {
  const ends = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((end): end is number => typeof end === 'number')
  return ends.length ? new Date(Math.max(...ends) * 1000) : null
}

export const toSubscriptionFields = (
  subscription: Stripe.Subscription
): StripeSubscriptionFields => ({
  stripeCustomerId: idOf(subscription.customer) ?? '',
  stripeSubscriptionId: subscription.id,
  status: toStatus(subscription.status),
  currentPeriodEnd: periodEnd(subscription),
  // A cancel date set in the portal ("cancel at") counts the same as cancel at period end
  cancelAtPeriodEnd:
    subscription.cancel_at_period_end || subscription.cancel_at != null,
})
