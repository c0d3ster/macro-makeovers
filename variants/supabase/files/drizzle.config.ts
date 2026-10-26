import 'reflect-metadata' // @module:graphql
import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Used only by `pnpm run db:pull` to introspect the database into Drizzle schema files.
// Migrations are owned by the Supabase CLI (see supabase/migrations).
config({ path: '.env.local' })
config({ path: '.env' }) // Fallback for any missing vars

export default defineConfig({
  // Pulled output lands here, then gets reviewed and copied into src/models
  out: './.drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    // Use the direct connection (port 5432), not the transaction pooler
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
})
