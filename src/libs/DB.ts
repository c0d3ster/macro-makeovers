import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { drizzle } from 'drizzle-orm/node-postgres'

import { schemas } from '@/models'

import { requireEnv } from './Env'

// Stores the db connection in the global scope to prevent multiple instances due to hot reloading with Next.js
const globalForDb = globalThis as unknown as {
  drizzle: NodePgDatabase<typeof schemas> | undefined
}

// Need a database for production? Check out https://www.prisma.io/?via=nextjsboilerplate
// Tested and compatible with Next.js Boilerplate
const createDbConnection = () => {
  const databaseUrl = requireEnv.DATABASE_URL()
  return drizzle({
    connection: {
      connectionString: databaseUrl,
      ssl:
        !databaseUrl.includes('localhost') &&
        !databaseUrl.includes('127.0.0.1'),
    },
    schema: schemas,
  })
}

// Lazy initialization: only create connection when actually accessed
// This prevents errors during Next.js build when DATABASE_URL might not be available
const getDb = () => {
  if (!globalForDb.drizzle) {
    globalForDb.drizzle = createDbConnection()
  }
  return globalForDb.drizzle
}

// Export a proxy that lazily initializes the connection
// This defers connection creation until the db is actually used at runtime
// During Next.js build, code is analyzed but not executed, so this won't trigger
export const db = new Proxy({} as NodePgDatabase<typeof schemas>, {
  get(_target, prop) {
    return getDb()[prop as keyof NodePgDatabase<typeof schemas>]
  },
}) as NodePgDatabase<typeof schemas>
