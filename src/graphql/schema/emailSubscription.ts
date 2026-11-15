import { Field, InputType } from 'type-graphql'

@InputType('EmailSubscribeInput', {
  description: 'An email list sign-up. The source fields come from the visitor cookie.',
})
export class EmailSubscribeInput {
  @Field(() => String)
  email!: string

  @Field(() => String, {
    nullable: true,
    description: 'The page the form was on',
  })
  path?: string

  @Field(() => String, { nullable: true })
  source?: string

  @Field(() => String, { nullable: true })
  medium?: string

  @Field(() => String, { nullable: true })
  campaign?: string

  @Field(() => String, {
    nullable: true,
    description: 'Honeypot. People leave it empty; bots fill it in.',
  })
  website?: string
}
