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
        resolverClasses.BasketResolver,
        resolverClasses.BillingResolver,
        resolverClasses.ContactResolver,
        resolverClasses.EmailSubscriptionResolver,
        resolverClasses.GroceryResolver,
        resolverClasses.HealthResolver,
        resolverClasses.RecipeResolver,
        resolverClasses.UserResolver,
      ],
      validate: false,
      container: {
        get(someClass) {
          if (someClass === resolverClasses.BasketResolver)
            return new resolverClasses.BasketResolver(services.basketService)
          if (someClass === resolverClasses.BillingResolver)
            return new resolverClasses.BillingResolver(services.billingService)
          if (someClass === resolverClasses.ContactResolver)
            return new resolverClasses.ContactResolver(services.contactService)
          if (someClass === resolverClasses.EmailSubscriptionResolver)
            return new resolverClasses.EmailSubscriptionResolver(
              services.emailSubscriptionService
            )
          if (someClass === resolverClasses.GroceryResolver)
            return new resolverClasses.GroceryResolver(services.groceryService)
          if (someClass === resolverClasses.RecipeResolver)
            return new resolverClasses.RecipeResolver(services.recipeService)
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
