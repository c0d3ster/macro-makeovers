import type { NextRequest } from 'next/server'

import 'reflect-metadata'

import { services } from '@/services'

// Stripe calls this for checkout.session.completed, customer.subscription.updated,
// customer.subscription.deleted, and invoice.payment_failed. The raw body is what Stripe signed,
// so it is read as text and never parsed before the signature check.
export const POST = async (req: NextRequest): Promise<Response> => {
  const rawBody = await req.text()
  const { status, outcome } = await services.billingService.handleWebhook(
    rawBody,
    req.headers.get('stripe-signature')
  )
  return Response.json({ received: status === 200, outcome }, { status })
}
