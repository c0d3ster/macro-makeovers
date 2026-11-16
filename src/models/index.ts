// Re-export for convenience
import * as basketModels from './basket'
import { emailSubscribers } from './emailSubscribers'
import * as groceryModels from './grocery'
import * as recipeModels from './recipes'
import { stripeEvents, subscriptions } from './subscriptions'
import { users } from './users'

// Export all tables
export * from './basket'
export * from './emailSubscribers'
// Export all enums
export * from './enums'
export * from './grocery'
export * from './recipes'
export * from './subscriptions'
export * from './users'

// Tables and relations together, which is what db.query needs
export const schemas = {
  users,
  emailSubscribers,
  ...groceryModels,
  subscriptions,
  stripeEvents,
  ...recipeModels,
  ...basketModels,
}
