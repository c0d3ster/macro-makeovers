import { track as vercelTrack } from '@vercel/analytics'

import type { AnalyticsEvent, TrackArgs } from './funnelEvents'

import { toEventProperties } from './funnelEvents'

// Sends a custom event from the browser. Analytics must never break the page, so failures are
// swallowed. In development Vercel only logs the event to the console.
export const track = <E extends AnalyticsEvent>(
  event: E,
  ...[properties]: TrackArgs<E>
): void => {
  try {
    vercelTrack(event, toEventProperties(properties))
  } catch {
    // Blocked by an extension or not loaded yet
  }
}
