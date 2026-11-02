// Re-export for convenience
import * as recipeModels from './recipes'
import { users } from './users'

// Export all enums
export * from './enums'
// Export all tables
export * from './recipes'
export * from './users'

// Tables and relations together, which is what db.query needs
export const schemas = {
  users,
  ...recipeModels,
}
