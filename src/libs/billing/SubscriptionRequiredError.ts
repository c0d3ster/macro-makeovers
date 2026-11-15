import { GraphQLError } from 'graphql'

import { SUBSCRIPTION_REQUIRED } from './subscriptionRequired'

// What a paid resolver throws for a signed-in user without paid access. The UI turns the code
// into an upgrade prompt.
export class SubscriptionRequiredError extends GraphQLError {
  constructor(feature: string) {
    super(`${feature} comes with the paid plan.`, {
      extensions: { code: SUBSCRIPTION_REQUIRED, feature },
    })
  }
}

export class SignInRequiredError extends GraphQLError {
  constructor() {
    super('Sign in to continue.', { extensions: { code: 'UNAUTHORIZED' } })
  }
}

type PaidAccessContext = {
  authId?: string
  hasPaidAccess: () => Promise<boolean>
}

// Call first in every paid resolver. Gating lives here, on the server, never only in the UI.
export const requirePaidAccess = async (
  { authId, hasPaidAccess }: PaidAccessContext,
  feature: string
): Promise<void> => {
  if (!authId) throw new SignInRequiredError()
  if (!(await hasPaidAccess())) throw new SubscriptionRequiredError(feature)
}
