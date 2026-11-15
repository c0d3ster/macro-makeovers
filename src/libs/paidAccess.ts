import type { GraphQLContext } from '@/graphql/context'

// The paid check for grocery calls: PRD 01's hasPaidAccess for the signed-in user, which also
// lets the site owner through. Every paid grocery resolver goes through here.
export const checkPaidAccess = async (
  ctx: Pick<GraphQLContext, 'user' | 'hasPaidAccess'>
): Promise<boolean> => {
  if (!ctx.user) return false
  return ctx.hasPaidAccess()
}
