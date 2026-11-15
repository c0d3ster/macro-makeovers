import { GraphQLError } from 'graphql'
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'

import type { GraphQLContext } from '@/graphql/context'
import type { GroceryService } from '@/services'

import {
  GroceryHandoff,
  GroceryHandoffOptions,
  GroceryStoreSuggestion,
  SendBasketInput,
} from '@/graphql/schema'
import { checkPaidAccess } from '@/libs/paidAccess'
import { GroceryError } from '@/services/GroceryError'

const toGraphQLError = (error: unknown): unknown =>
  error instanceof GroceryError
    ? new GraphQLError(error.message, { extensions: { code: error.code } })
    : error

// "Send to cart" is paid (PRD 05 requirement 1). The gate lives here, on the server: the picker
// only hides what this would refuse anyway.
const requirePaidMember = async (ctx: GraphQLContext): Promise<string> => {
  if (!ctx.user)
    throw new GraphQLError('Sign in to send your basket to a grocer.', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  if (!(await checkPaidAccess(ctx)))
    throw new GraphQLError('Send to cart comes with the paid plan.', {
      extensions: { code: 'SUBSCRIPTION_REQUIRED' },
    })
  return ctx.user.id
}

@Resolver()
export class GroceryResolver {
  constructor(private groceryService: GroceryService) {}

  // Free members get the grocer list too, so the button and its upgrade prompt stay visible
  @Query(() => GroceryHandoffOptions)
  async groceryHandoffOptions(@Ctx() ctx: GraphQLContext): Promise<GroceryHandoffOptions> {
    const hasPaidAccess = await checkPaidAccess(ctx)
    return this.groceryService.getOptions({
      ...(ctx.user ? { userId: ctx.user.id } : {}),
      hasPaidAccess,
    })
  }

  // Paid only, since each search spends Kroger's daily quota
  @Query(() => GroceryStoreSuggestion)
  async groceryStores(
    @Arg('zip', () => String) zip: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<GroceryStoreSuggestion> {
    await requirePaidMember(ctx)
    try {
      return await this.groceryService.suggestStores(zip.trim())
    } catch (error) {
      throw toGraphQLError(error)
    }
  }

  @Mutation(() => GroceryHandoff)
  async sendBasketToGrocer(
    @Arg('input', () => SendBasketInput) input: SendBasketInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<GroceryHandoff> {
    const userId = await requirePaidMember(ctx)
    try {
      return await this.groceryService.send(userId, input)
    } catch (error) {
      throw toGraphQLError(error)
    }
  }
}
