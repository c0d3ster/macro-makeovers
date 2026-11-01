// Re-export for convenience
import {
  ingredients,
  recipeNotes,
  recipeNutrition,
  recipeRevisions,
  recipes,
  recipeTags,
  steps,
  tags,
} from './recipes'
import { users } from './users'

// Export all enums
export * from './enums'
// Export all tables
export * from './recipes'
export * from './users'

export const schemas = {
  users,
  recipes,
  recipeNutrition,
  ingredients,
  steps,
  recipeNotes,
  tags,
  recipeTags,
  recipeRevisions,
}
