import type { GraphQLContext } from '@/graphql/context'

// Seam for PRD 01's hasPaidAccess. The Stripe work (feat/stripe-subscription) builds the real
// check server-side. Until it merges, only the site owner counts as paid, so paid features stay
// hidden from members even with their flags on. To wire it up, replace the body with a call to
// that hasPaidAccess for ctx.user; every paid resolver already goes through here.
export const checkPaidAccess = async (
  ctx: Pick<GraphQLContext, 'user' | 'isOwner'>
): Promise<boolean> => {
  if (!ctx.user) return false
  return ctx.isOwner()
}
