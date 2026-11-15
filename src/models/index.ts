// Re-export for convenience
import { emailSubscribers } from './emailSubscribers'
import * as recipeModels from './recipes'
import { users } from './users'

// Export all tables
export * from './emailSubscribers'
// Export all enums
export * from './enums'
export * from './recipes'
export * from './users'

// Tables and relations together, which is what db.query needs
export const schemas = {
  users,
  emailSubscribers,
  ...recipeModels,
}
