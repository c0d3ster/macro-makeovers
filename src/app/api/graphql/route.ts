import 'reflect-metadata'

import type { NextRequest } from 'next/server'

import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'

import { createContext, createSchema } from '@/graphql'
import { logger } from '@/libs/Logger'

// Errors a resolver throws deliberately, with a message written for the person who sees it
const CLIENT_SAFE_CODES = new Set(['FORBIDDEN', 'NOT_FOUND'])

const server = new ApolloServer({
  schema: await createSchema(),
  introspection: process.env.NODE_ENV !== 'production',
  formatError: (error) => {
    // Log errors for debugging
    logger.error('GraphQL Error:', { error })

    // A resolver chose this message on purpose, so the client can show it
    if (CLIENT_SAFE_CODES.has(String(error.extensions?.code))) return error

    // Return sanitized error in production
    if (process.env.NODE_ENV === 'production') {
      return {
        message: 'Internal server error',
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      }
    }

    return error
  },
})

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => {
    return await createContext(req)
  },
})

export const GET = async (req: NextRequest) => {
  return handler(req)
}

export const POST = async (req: NextRequest) => {
  return handler(req)
}
