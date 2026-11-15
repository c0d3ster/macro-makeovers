import { Ctx, Mutation, Query, Resolver } from 'type-graphql'

import type { GraphQLContext } from '@/graphql/context'
import type { BillingService } from '@/services'

import { Plan } from '@/graphql/schema'
import { requirePaidAccess, SignInRequiredError } from '@/libs/billing'

type SignedInUser = { id: string; email: string }

const signedInUser = ({ user }: GraphQLContext): SignedInUser => {
  if (!user) throw new SignInRequiredError()
  return user
}

@Resolver()
export class BillingResolver {
  constructor(private billingService: BillingService) {}

  @Query(() => Plan, { nullable: true })
  async myPlan(@Ctx() ctx: GraphQLContext): Promise<Plan | null> {
    if (!ctx.user) return null
    const plan = await this.billingService.getPlan(ctx.user.id, await ctx.isOwner())
    return {
      ...plan,
      currentPeriodEnd: plan.currentPeriodEnd?.toISOString(),
    }
  }

  // Returns the Stripe Checkout URL to send the browser to
  @Mutation(() => String)
  async startCheckout(@Ctx() ctx: GraphQLContext): Promise<string> {
    const user = signedInUser(ctx)
    return this.billingService.startCheckout(user, await ctx.isOwner())
  }

  // Returns the Stripe Customer Portal URL to send the browser to
  @Mutation(() => String)
  async openBillingPortal(@Ctx() ctx: GraphQLContext): Promise<string> {
    const user = signedInUser(ctx)
    return this.billingService.openBillingPortal(user, await ctx.isOwner())
  }

  // Paid: a signed, five-minute link to the book PDF in the private bucket. A mutation so the
  // link is never cached or prefetched.
  @Mutation(() => String)
  async bookDownloadUrl(@Ctx() ctx: GraphQLContext): Promise<string> {
    await requirePaidAccess(ctx, 'The book download')
    return this.billingService.bookDownloadUrl()
  }
}
