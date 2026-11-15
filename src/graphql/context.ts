import type { NextRequest } from 'next/server'

import { eq } from 'drizzle-orm'

import { hasPaidAccess, SubscriptionRepository } from '@/libs/billing'
import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { isSupabaseConfigured } from '@/libs/supabase/client'
import {
  isOwnerForToken,
  isOwner as isSessionOwner,
} from '@/libs/supabase/owner'
import { getAuthId } from '@/libs/supabase/server'
import { schemas } from '@/models'

export type GraphQLContext = {
  authId?: string
  user?: typeof schemas.users.$inferSelect | null
  db: typeof db
  schemas: typeof schemas
  // Set for HTTP and MCP calls
  req?: NextRequest
  // Whether the caller is the site owner, decided by the database when first asked. Resolvers
  // that write recipes gate on this.
  isOwner: () => Promise<boolean>
  // Whether the caller has the paid plan (or is the owner), checked once per request. Every
  // paid resolver gates on this through requirePaidAccess.
  hasPaidAccess: () => Promise<boolean>
}

type AuthContext = Pick<GraphQLContext, 'authId' | 'user'>

const subscriptionRepository = new SubscriptionRepository()

// Asks once, then reuses the answer for the rest of the request
const memo = <T>(load: () => Promise<T>): (() => Promise<T>) => {
  let pending: Promise<T> | undefined
  return () => {
    pending ??= load()
    return pending
  }
}

// Owners always have access. Otherwise any grant in good standing counts, whatever its source.
const paidAccessCheck = (
  authId: string | undefined,
  isOwner: () => Promise<boolean>
): (() => Promise<boolean>) =>
  memo(async () => {
    if (!authId) return false
    if (await isOwner()) return true
    try {
      const grants = await subscriptionRepository.findByAuthId(authId)
      return hasPaidAccess({ isOwner: false, grants })
    } catch (error) {
      logger.error('Paid access check failed', { error: String(error), authId })
      return false
    }
  })

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
): Promise<GraphQLContext> => {
  const auth = await getAuthContext()
  const isOwner = memo(isSessionOwner)
  return {
    db,
    schemas,
    req,
    isOwner,
    hasPaidAccess: paidAccessCheck(auth.authId, isOwner),
    ...auth,
  }
}

type TokenCaller = {
  authId: string
  token: string
}

// Context for a caller that proves who it is with a bearer token instead of cookies, which is
// how the MCP route calls the schema in-process
export const createTokenContext = (
  req: NextRequest,
  { authId, token }: TokenCaller
): GraphQLContext => {
  const isOwner = memo(() => isOwnerForToken(token))
  return {
    db,
    schemas,
    req,
    authId,
    isOwner,
    hasPaidAccess: paidAccessCheck(authId, isOwner),
  }
}
