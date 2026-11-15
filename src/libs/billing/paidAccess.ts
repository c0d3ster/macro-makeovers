import type { subscriptions } from '@/models'

export type SubscriptionRow = typeof subscriptions.$inferSelect

// The parts of a row that decide access. A partner grant has the same shape as a Stripe row.
export type AccessGrant = Pick<
  SubscriptionRow,
  'source' | 'status' | 'currentPeriodEnd' | 'pastDueSince'
>

// Keep in step with public.has_paid_access() in the subscriptions migration
export const GRACE_DAYS = 3
const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000

const withinGrace = (from: Date, now: Date): boolean =>
  from.getTime() + GRACE_MS > now.getTime()

// Whether one grant gives paid access right now. Active or trialing stays good until a few days
// past the period end, so a late renewal webhook does not cut anyone off. A grant with no period
// end (an open partner grant) stays good until its status changes. Past due gets a short grace
// window from when the charge failed, while Stripe retries the card.
export const grantGivesAccess = (grant: AccessGrant, now: Date): boolean => {
  const { status, currentPeriodEnd, pastDueSince } = grant
  if (status === 'active' || status === 'trialing') {
    return !currentPeriodEnd || withinGrace(currentPeriodEnd, now)
  }
  if (status === 'past_due') {
    return !!pastDueSince && withinGrace(pastDueSince, now)
  }
  return false
}

type PaidAccessInput = {
  isOwner: boolean
  grants: AccessGrant[]
  now?: Date
}

// The one check every paid feature uses: the meal planner, "Send to cart", and the book.
// Source-agnostic on purpose: any grant that is in good standing counts.
export const hasPaidAccess = ({
  isOwner,
  grants,
  now = new Date(),
}: PaidAccessInput): boolean =>
  isOwner || grants.some((grant) => grantGivesAccess(grant, now))

// The grant that gives access, preferring Stripe so the account page can offer billing
export const activeGrant = <T extends AccessGrant>(
  grants: T[],
  now: Date = new Date()
): T | undefined => {
  const live = grants.filter((grant) => grantGivesAccess(grant, now))
  return live.find(({ source }) => source === 'stripe') ?? live[0]
}
