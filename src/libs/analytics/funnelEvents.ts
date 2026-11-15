// The funnel from PRD 07, then the actions worth counting along the way. Vercel Analytics shows
// each name as its own custom event, so renaming one starts a new series.
export const FUNNEL_EVENTS = [
  'visit',
  'recipe_view',
  'sign_up',
  'profile_completed',
  'plan_created',
  'upgrade_prompt_seen',
  'checkout_started',
  'subscription_active',
  'subscription_canceled',
] as const

const ACTION_EVENTS = [
  'basket_add',
  'basket_remove',
  'bundle_add',
  'email_subscribe',
  'email_confirmed',
] as const

export const ANALYTICS_EVENTS = [...FUNNEL_EVENTS, ...ACTION_EVENTS] as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]

// Where the visitor came from, flattened so it fits Vercel's flat event properties
export type SourceProperties = {
  source: string
  medium?: string
  campaign?: string
}

type NoProperties = Record<string, never>

// Vercel only takes flat string, number, boolean, or null values
export type AnalyticsEventProperties = {
  visit: SourceProperties & { path: string }
  recipe_view: { slug: string }
  sign_up: Partial<SourceProperties> & { method: 'email' | 'google' }
  profile_completed: NoProperties
  plan_created: { recipes?: number }
  // Which paid feature the prompt was for, like 'send_to_cart' or 'book'
  upgrade_prompt_seen: { feature: string }
  checkout_started: { plan?: string }
  subscription_active: { plan?: string }
  subscription_canceled: { plan?: string }
  // 'recipe_page' for the full button, 'card' for the round one on a card photo
  basket_add: { slug: string; build?: string; placement: 'recipe_page' | 'card' }
  basket_remove: { slug: string; placement: 'recipe_page' | 'card' }
  // Comma-joined, since properties cannot be arrays
  bundle_add: { slugs: string }
  email_subscribe: { path: string }
  email_confirmed: NoProperties
}

// Events with no required properties can be tracked with just a name
export type TrackArgs<E extends AnalyticsEvent> =
  NoProperties extends AnalyticsEventProperties[E]
    ? [properties?: AnalyticsEventProperties[E]]
    : [properties: AnalyticsEventProperties[E]]

export const isAnalyticsEvent = (name: string): name is AnalyticsEvent =>
  (ANALYTICS_EVENTS as readonly string[]).includes(name)

// Drops undefined values so Vercel does not record them as empty properties
export const toEventProperties = (
  properties: object | undefined
): Record<string, string | number | boolean | null> | undefined => {
  if (!properties) return undefined
  const entries = Object.entries(properties).filter(
    ([, value]) => value !== undefined
  )
  return entries.length ? Object.fromEntries(entries) : undefined
}
