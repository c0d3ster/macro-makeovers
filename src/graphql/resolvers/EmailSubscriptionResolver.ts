import { Arg, Ctx, Mutation, Resolver } from 'type-graphql'

import type { GraphQLContext } from '@/graphql/context'
import type { EmailSubscriptionService } from '@/services'

import { EmailSubscribeInput } from '@/graphql/schema'

@Resolver()
export class EmailSubscriptionResolver {
  constructor(private emailSubscriptionService: EmailSubscriptionService) {}

  @Mutation(() => Boolean, {
    description:
      'Adds an address to the email list as pending and sends the confirmation link. Always true for a valid address, so it never reveals who is on the list.',
  })
  async subscribeToEmails(
    @Arg('input', () => EmailSubscribeInput) input: EmailSubscribeInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<boolean> {
    return this.emailSubscriptionService.subscribe(input, ctx.user?.id)
  }

  @Mutation(() => Boolean, {
    description:
      'Confirms an address from its emailed link and sends the welcome email. False for an unknown or unsubscribed link.',
  })
  async confirmEmailSubscription(
    @Arg('token', () => String) token: string
  ): Promise<boolean> {
    return this.emailSubscriptionService.confirm(token)
  }

  @Mutation(() => Boolean, {
    description: 'Takes an address off the email list. False for an unknown link.',
  })
  async unsubscribeFromEmails(
    @Arg('token', () => String) token: string
  ): Promise<boolean> {
    return this.emailSubscriptionService.unsubscribe(token)
  }
}
