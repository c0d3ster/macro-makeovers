import { unstable_cache } from 'next/cache'

import { logger } from '@/libs/Logger'

import { formatPlanPrice } from './billingConfig'
import { getStripe } from './stripeClient'

// The Stripe price is the one source of truth for what the plan costs, so swapping
// STRIPE_PRICE_ID changes the charge and the pricing page together.
const readPlanPriceCents = unstable_cache(
  async (priceId: string): Promise<number | null> => {
    const setup = getStripe()
    if (!setup) return null
    const price = await setup.stripe.prices.retrieve(priceId)
    return price.unit_amount
  },
  ['stripe-plan-price'],
  { revalidate: 3600 }
)

export const getPlanPrice = async (): Promise<string> => {
  const setup = getStripe()
  if (!setup) return formatPlanPrice(undefined)

  try {
    return formatPlanPrice(await readPlanPriceCents(setup.config.priceId))
  } catch (error) {
    logger.error('Could not read the plan price from Stripe', { error })
    return formatPlanPrice(undefined)
  }
}
