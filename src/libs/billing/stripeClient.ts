import Stripe from 'stripe'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

import type { BillingConfig } from './billingConfig'

import { readBillingConfig } from './billingConfig'

export type StripeSetup = { stripe: Stripe; config: BillingConfig }

let cached: StripeSetup | undefined

// Created on first use, never at import, so the build and tests work without keys
export const getStripe = (): StripeSetup | undefined => {
  if (cached) return cached

  const result = readBillingConfig(Env)
  if ('missing' in result) {
    logger.warn('Stripe is not configured', { missing: result.missing })
    return undefined
  }

  cached = {
    stripe: new Stripe(result.config.secretKey),
    config: result.config,
  }
  return cached
}
