import { track as vercelTrack } from '@vercel/analytics/server'

import { logger } from '@/libs/Logger'

import type { AnalyticsEvent, AnalyticsEventProperties } from './funnelEvents'

import { toEventProperties } from './funnelEvents'

type TrackServerOptions = {
  // The incoming request, which ties the event to the visitor's session. Inside a route
  // handler Vercel can usually find it alone, but a webhook should pass it.
  request?: { headers: Headers }
}

// Sends a custom event from a route handler, server action, or webhook, such as a Stripe
// subscription change. Kept out of the barrel so client bundles never pull in the server SDK.
export const trackServer = async <E extends AnalyticsEvent>(
  event: E,
  properties: AnalyticsEventProperties[E],
  { request }: TrackServerOptions = {}
): Promise<void> => {
  try {
    await vercelTrack(
      event,
      toEventProperties(properties),
      request ? { request } : undefined
    )
  } catch (error) {
    logger.warn('Could not send analytics event', {
      event,
      error: String(error),
    })
  }
}
