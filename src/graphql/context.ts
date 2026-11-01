import type { NextRequest } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { isSupabaseConfigured } from '@/libs/supabase/client'
import {
  isOwner as isSessionOwner,
  isOwnerForToken,
} from '@/libs/supabase/owner'
import { getAuthId } from '@/libs/supabase/server'
import { schemas } from '@/models'

export type GraphQLContext = {
  authId?: string
  user?: typeof schemas.users.$inferSelect | null
  db: typeof db
  schemas: typeof schemas
  req: NextRequest
  // Whether the caller is the site owner, decided by the database when first asked. Resolvers
  // that write recipes gate on this.
  isOwner: () => Promise<boolean>
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
  isOwner: isSessionOwner,
  ...(await getAuthContext()),
})

type TokenCaller = {
  authId: string
  token: string
}

// Context for a caller that proves who it is with a bearer token instead of cookies, which is
// how the MCP route calls the schema in-process
export const createTokenContext = (
  req: NextRequest,
  { authId, token }: TokenCaller
): GraphQLContext => ({
  db,
  schemas,
  req,
  authId,
  isOwner: () => isOwnerForToken(token),
})
