import type { NextRequest } from 'next/server'

import { eq } from 'drizzle-orm' // @module:auth

import { db } from '@/libs/DB' // @module:database
import { logger } from '@/libs/Logger' // @module:auth
import { isSupabaseConfigured } from '@/libs/supabase/client' // @module:auth
import { getAuthId } from '@/libs/supabase/server' // @module:auth
import { schemas } from '@/models' // @module:database

export type GraphQLContext = {
  authId?: string // @module:auth
  user?: typeof schemas.users.$inferSelect | null // @module:auth
  db: typeof db // @module:database
  schemas: typeof schemas // @module:database
  req: NextRequest
}

// #region @module:auth
type AuthContext = Pick<GraphQLContext, 'authId' | 'user'>

// Resolves the signed-in user, degrading to a partial or empty result on failure
const getAuthContext = async (): Promise<AuthContext> => {
  if (!isSupabaseConfigured()) return {}

  try {
    const authId = await getAuthId()

    if (!authId) return {}

    // Get user from database
    try {
      const user = await db.query.users.findFirst({
        where: eq(schemas.users.authId, authId),
      })

      return user ? { authId, user } : { authId }
    } catch (error) {
      // Preserve authId even if DB query fails
      logger.error('Database query failed in GraphQL context', {
        error: String(error),
        authId,
      })
      return { authId }
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
