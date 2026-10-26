import 'reflect-metadata'

import type { NextRequest } from 'next/server'

import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'

import { createContext, createSchema } from '@/graphql'
import { logger } from '@/libs/Logger'

const server = new ApolloServer({
  schema: await createSchema(),
  introspection: process.env.NODE_ENV !== 'production',
  formatError: (error) => {
    // Log errors for debugging
    logger.error('GraphQL Error:', { error })

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
