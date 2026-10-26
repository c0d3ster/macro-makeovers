import type { NextRequest } from 'next/server'

// #region @module:auth
import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
// #endregion @module:auth

import { db } from '@/libs/DB' // @module:database
import { logger } from '@/libs/Logger' // @module:auth
import { schemas } from '@/models' // @module:database

export type GraphQLContext = {
  userId?: string // @module:auth
  user?: typeof schemas.users.$inferSelect | null // @module:auth
  db: typeof db // @module:database
  schemas: typeof schemas // @module:database
  req: NextRequest
}

// #region @module:auth
type AuthContext = Pick<GraphQLContext, 'user' | 'userId'>

// Resolves the signed-in user, degrading to a partial or empty result on failure
const getAuthContext = async (): Promise<AuthContext> => {
  if (!process.env.CLERK_SECRET_KEY) return {}

  try {
    const { userId } = await auth()

    if (!userId) return {}

    // Get user from database
    try {
      const user = await db.query.users.findFirst({
        where: eq(schemas.users.clerkId, userId),
      })

      return user ? { userId, user } : { userId }
    } catch (error) {
      // Preserve userId even if DB query fails
      logger.error('Database query failed in GraphQL context', {
        error: String(error),
        userId,
      })
      return { userId }
    }
  } catch (error) {
    // Auth failed, return empty context
    logger.error('Authentication failed in GraphQL context', {
      error: String(error),
    })
    return {}
  }
}
// #endregion @module:auth

export const createContext = async (
  req: NextRequest
): Promise<GraphQLContext> => ({
  db, // @module:database
  schemas, // @module:database
  req,
  ...(await getAuthContext()), // @module:auth
})
