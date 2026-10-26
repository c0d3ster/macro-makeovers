import 'reflect-metadata' // @module:graphql
import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Load environment files for local builds only
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
  // Local production build - load production env files
  config({ path: '.env.production.local' })
  config({ path: '.env.production' })
  config({ path: '.env' }) // Fallback for any missing vars
} else if (!process.env.VERCEL_ENV && process.env.NODE_ENV !== 'test') {
  // Local development build - load development env files
  config({ path: '.env.local' })
  config({ path: '.env' }) // Fallback for any missing vars
}
// Remote environments (CI: NODE_ENV=test, Vercel: VERCEL_ENV set) use environment variables only

const getDatabaseUrl = () => {
  return process.env.DATABASE_URL ?? ''
}

export default defineConfig({
  out: './migrations',
  schema: './src/models/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  verbose: true,
  strict: true,
})
