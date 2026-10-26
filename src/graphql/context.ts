import type { NextRequest } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { isSupabaseConfigured } from '@/libs/supabase/client'
import { getAuthId } from '@/libs/supabase/server'
import { schemas } from '@/models'

export type GraphQLContext = {
  authId?: string
  user?: typeof schemas.users.$inferSelect | null
  db: typeof db
  schemas: typeof schemas
  req: NextRequest
}

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

export const createContext = async (
  req: NextRequest
): Promise<GraphQLContext> => ({
  db,
  schemas,
  req,
  ...(await getAuthContext()),
})
