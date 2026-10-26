import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'

import type { UpdateUserInput } from '@/graphql/schema'

import { db } from '@/libs/DB'
import { getAuthId } from '@/libs/supabase/server'
import { schemas } from '@/models'

export class UserService {
  async getCurrentUserWithAuth() {
    const authId = await getAuthId()
    if (!authId) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHORIZED' },
      })
    }

    const user = await db.query.users.findFirst({
      where: eq(schemas.users.authId, authId),
    })

    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'USER_NOT_FOUND' },
      })
    }

    return user
  }

  // RLS only protects the Supabase API and Realtime, which connect as the signed-in user.
  // Drizzle connects as `postgres` and bypasses RLS, so every query here must check
  // access itself. Until there is admin logic, a user can only read their own row.
  async getUserById(id: string) {
    const currentUser = await this.getCurrentUserWithAuth()

    if (currentUser.id !== id) {
      throw new GraphQLError('Forbidden', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    return currentUser
  }

  async updateUser(id: string, input: UpdateUserInput) {
    const authId = await getAuthId()
    if (!authId) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHORIZED' },
      })
    }

    // Get the authenticated user
    const authUser = await db.query.users.findFirst({
      where: eq(schemas.users.authId, authId),
    })

    if (!authUser) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'USER_NOT_FOUND' },
      })
    }

    // Only allow users to update their own profile (unless admin logic is added later)
    if (authUser.id !== id) {
      throw new GraphQLError('Forbidden', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    // Update the user
    const [updatedUser] = await db
      .update(schemas.users)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(schemas.users.id, id))
      .returning()

    if (!updatedUser) {
      throw new GraphQLError('Failed to update user', {
        extensions: { code: 'UPDATE_FAILED' },
      })
    }

    return updatedUser
  }
}
