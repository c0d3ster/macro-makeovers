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
        resolverClasses.ContactResolver, // @module:email
        resolverClasses.HealthResolver,
        resolverClasses.UserResolver, // @module:auth
      ],
      validate: false,
      container: {
        get(someClass) {
          // #region @module:email
          if (someClass === resolverClasses.ContactResolver)
            return new resolverClasses.ContactResolver(services.contactService)
          // #endregion @module:email
          // #region @module:auth
          if (someClass === resolverClasses.UserResolver)
            return new resolverClasses.UserResolver(services.userService)
          // #endregion @module:auth
          return new (someClass as any)()
        },
      },
    })
  }
  return schemaPromise
}

export { createContext, createSchema }
