import { GraphQLError } from 'graphql'
import { Arg, ID, Mutation, Query, Resolver } from 'type-graphql'

import type { UserService } from '@/services'

import { UpdateUserInput, User } from '@/graphql/schema'
import { logger } from '@/libs/Logger'

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => User, { nullable: true })
  async me() {
    try {
      const user = await this.userService.getCurrentUserWithAuth()
      return user
    } catch (error) {
      logger.error('Error in me query', { error: String(error) })
      return null
    }
  }

  @Query(() => User, { nullable: true })
  async user(@Arg('id', () => ID) id: string) {
    try {
      const user = await this.userService.getUserById(id)
      return user
    } catch (error: unknown) {
      logger.error('Error in user query', { error, id })

      if (
        error instanceof GraphQLError &&
        error.extensions?.code === 'USER_NOT_FOUND'
      ) {
        return null
      }

      throw error
    }
  }

  @Mutation(() => User)
  async updateUser(
    @Arg('id', () => ID) id: string,
    @Arg('input', () => UpdateUserInput) input: UpdateUserInput
  ) {
    try {
      const user = await this.userService.updateUser(id, input)
      return user
    } catch (error) {
      logger.error('Error in updateUser mutation', {
        error: String(error),
        id,
      })
      throw error
    }
  }
}
