export type BillingConfig = {
  secretKey: string
  webhookSecret: string
  priceId: string
}

type BillingEnv = {
  STRIPE_SECRET_KEY?: string | undefined
  STRIPE_WEBHOOK_SECRET?: string | undefined
  STRIPE_PRICE_ID?: string | undefined
}

// Checkout, the portal, and the webhook need all three. Returns the missing names otherwise, so
// callers can log them and refuse cleanly, which is the normal state in dev and CI.
export const readBillingConfig = ({
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_ID,
}: BillingEnv): { config: BillingConfig } | { missing: string[] } => {
  if (STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET && STRIPE_PRICE_ID) {
    return {
      config: {
        secretKey: STRIPE_SECRET_KEY,
        webhookSecret: STRIPE_WEBHOOK_SECRET,
        priceId: STRIPE_PRICE_ID,
      },
    }
  }

  const missing = Object.entries({
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name)
  return { missing }
}

// The monthly price as shown on the pricing page. The charge itself comes from the Stripe price
// (STRIPE_PRICE_ID), so a founding-member price is a new Stripe price plus this value, not code.
export const formatPlanPrice = (usd: string | undefined): string => {
  const value = Number(usd)
  if (!usd || !Number.isFinite(value) || value <= 0) return '$5'
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`
}
