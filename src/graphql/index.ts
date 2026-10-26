import 'reflect-metadata'
import type { GraphQLSchema } from 'graphql'

import { buildSchema } from 'type-graphql'

import { services } from '@/services'

import { createContext } from './context'
import * as resolverClasses from './resolvers'

// --- Singleton schema caching (important for Next.js) ---
let schemaPromise: Promise<GraphQLSchema> | null = null

async function createSchema(): Promise<GraphQLSchema> {
  if (!schemaPromise) {
    schemaPromise = buildSchema({
      resolvers: [
        resolverClasses.ContactResolver,
        resolverClasses.HealthResolver,
        resolverClasses.UserResolver,
      ],
      validate: false,
      container: {
        get(someClass) {
          if (someClass === resolverClasses.ContactResolver)
            return new resolverClasses.ContactResolver(services.contactService)
          if (someClass === resolverClasses.UserResolver)
            return new resolverClasses.UserResolver(services.userService)
          return new (someClass as any)()
        },
      },
    })
  }
  return schemaPromise
}

export { createContext, createSchema }
