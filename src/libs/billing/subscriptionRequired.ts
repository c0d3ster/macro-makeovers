// Kept apart from the rest of the billing code so client components can import it without
// pulling in the database or Stripe
export const SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED'

type ErrorLike = {
  graphQLErrors?: readonly { extensions?: Record<string, unknown> }[]
  errors?: readonly { extensions?: Record<string, unknown> }[]
  extensions?: Record<string, unknown>
}

// True when a GraphQL call failed because the paid plan is needed. Reads Apollo's error shapes
// (a combined error with `errors`, an older one with `graphQLErrors`) and a bare GraphQL error.
export const isSubscriptionRequired = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const { graphQLErrors, errors, extensions } = error as ErrorLike
  if (extensions?.code === SUBSCRIPTION_REQUIRED) return true
  return [...(graphQLErrors ?? []), ...(errors ?? [])].some(
    (item) => item.extensions?.code === SUBSCRIPTION_REQUIRED
  )
}
