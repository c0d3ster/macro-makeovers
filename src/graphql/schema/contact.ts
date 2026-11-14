import { Field, InputType, ObjectType } from 'type-graphql'

// A makeover idea from the about page: the dish someone wants rebuilt, plus optional context
@InputType('ContactFormInput')
export class ContactFormInput {
  @Field(() => String)
  name!: string

  @Field(() => String)
  email!: string

  @Field(() => String)
  dish!: string

  @Field(() => String, { nullable: true })
  recipeUrl?: string | null

  @Field(() => String, { nullable: true })
  details?: string | null
}

@ObjectType('ContactSubmission')
export class ContactSubmission {
  @Field(() => String)
  id!: string

  @Field(() => String)
  name!: string

  @Field(() => String)
  email!: string

  @Field(() => String)
  dish!: string

  @Field(() => String, { nullable: true })
  recipeUrl?: string | null

  @Field(() => String, { nullable: true })
  details?: string | null

  @Field(() => String)
  submittedAt!: string
}
