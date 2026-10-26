import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from 'type-graphql'

export enum UserRole {
  Client = 'client',
  Developer = 'developer',
  Admin = 'admin',
  SuperAdmin = 'super_admin',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role in the system',
})

@ObjectType('User')
export class User {
  @Field(() => ID)
  id!: string

  @Field(() => String, { nullable: true })
  clerkId?: string

  @Field(() => String)
  email!: string

  @Field(() => String, { nullable: true })
  firstName?: string

  @Field(() => String, { nullable: true })
  lastName?: string

  @Field(() => UserRole, { nullable: true })
  role?: UserRole

  @Field(() => String, { nullable: true })
  avatarUrl?: string

  @Field(() => String, { nullable: true })
  createdAt?: string

  @Field(() => String, { nullable: true })
  updatedAt?: string
}

@ObjectType()
export class UserDisplay {
  @Field(() => ID)
  id!: string

  @Field(() => String, { nullable: true })
  firstName?: string

  @Field(() => String, { nullable: true })
  lastName?: string

  @Field(() => String)
  email!: string
}

@InputType('UpdateUserInput')
export class UpdateUserInput {
  @Field(() => String, { nullable: true })
  firstName?: string

  @Field(() => String, { nullable: true })
  lastName?: string

  @Field(() => String, { nullable: true })
  avatarUrl?: string
}

@InputType('UserFilter')
export class UserFilter {
  @Field(() => UserRole, { nullable: true })
  role?: UserRole

  @Field(() => String, { nullable: true })
  email?: string

  @Field(() => String, { nullable: true })
  firstName?: string

  @Field(() => String, { nullable: true })
  lastName?: string
}
