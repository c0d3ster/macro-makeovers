import type { HandoffErrorCode } from '@/libs/grocery'

// Thrown by GroceryService to the resolver, which turns it into a GraphQL error with the same
// code. Kept apart from the service so the resolver doesn't pull in the database.
export class GroceryError extends Error {
  constructor(
    readonly code: HandoffErrorCode | 'BAD_USER_INPUT',
    message: string
  ) {
    super(message)
    this.name = 'GroceryError'
  }
}
