import { Field, ObjectType } from 'type-graphql'

// The signed-in user's plan, for the account page and upgrade prompts
@ObjectType('Plan')
export class Plan {
  @Field(() => Boolean)
  hasPaidAccess!: boolean

  // stripe, partner, or owner. Null without access.
  @Field(() => String, { nullable: true })
  source?: string

  // Stripe's status vocabulary (active, past_due, canceled, ...)
  @Field(() => String, { nullable: true })
  status?: string

  @Field(() => String, { nullable: true })
  currentPeriodEnd?: string

  @Field(() => Boolean)
  cancelAtPeriodEnd!: boolean

  @Field(() => Boolean)
  canSubscribe!: boolean

  @Field(() => Boolean)
  canManageBilling!: boolean
}
