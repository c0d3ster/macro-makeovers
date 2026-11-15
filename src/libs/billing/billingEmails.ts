import type { BillingEmailContent } from '@/services/EmailService'

import type { BillingEmail } from './handleStripeEvent'

const PAID_FEATURES =
  'the meal planner with leftover-aware suggestions, Send to cart from your basket, and the recipe book download'

const STAYS_FREE =
  'Every recipe, your basket, favorites, and reviews stay free either way.'

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

const greeting = (firstName: string | null | undefined): string =>
  firstName ? `Hi ${firstName},` : 'Hi,'

// The words of each subscription email. Plain on purpose: one short message and one link.
export const billingEmailContent = (
  email: BillingEmail,
  { appUrl, firstName }: { appUrl: string; firstName?: string | null }
): BillingEmailContent => {
  const base = appUrl.replace(/\/+$/, '')

  switch (email.kind) {
    case 'welcome':
      return {
        subject: 'Welcome to the Macro Makeovers plan',
        paragraphs: [
          greeting(firstName),
          `Thanks for subscribing. Your plan includes ${PAID_FEATURES}.`,
          STAYS_FREE,
          'Manage or cancel any time from your account page.',
        ],
        link: { label: 'Go to my account', href: `${base}/profile` },
      }
    case 'payment_failed':
      return {
        subject: 'Your Macro Makeovers payment did not go through',
        paragraphs: [
          greeting(firstName),
          'We could not charge your card for this month. Stripe will try again over the next few days.',
          `Update your card to keep ${PAID_FEATURES}.`,
          STAYS_FREE,
        ],
        link: { label: 'Update billing', href: `${base}/profile` },
      }
    case 'cancellation':
      return {
        subject: 'Your Macro Makeovers plan is canceled',
        paragraphs: [
          greeting(firstName),
          email.accessEndsAt && email.accessEndsAt.getTime() > Date.now()
            ? `Your plan is canceled. Paid features stay on until ${formatDate(email.accessEndsAt)}, and you will not be charged again.`
            : 'Your plan is canceled and you will not be charged again.',
          STAYS_FREE,
          'Changed your mind? You can subscribe again from the pricing page.',
        ],
        link: { label: 'See the plan', href: `${base}/pricing` },
      }
  }
}
