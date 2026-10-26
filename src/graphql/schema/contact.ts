import { Field, InputType, ObjectType } from 'type-graphql'

@InputType('ContactFormInput')
export class ContactFormInput {
  @Field(() => String)
  name!: string

  @Field(() => String)
  email!: string

  @Field(() => String)
  subject!: string

  @Field(() => String)
  message!: string
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
  subject!: string

  @Field(() => String)
  message!: string

  @Field(() => String)
  submittedAt!: string
}
