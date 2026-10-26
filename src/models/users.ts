import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { UserRole } from '@/graphql/schema/user'

import { userRoleEnum } from './enums'

// Users table that integrates with Clerk authentication
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(), // Clerk user ID
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default(UserRole.Client),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// Type exports for use in services and resolvers
export type UserRecord = typeof users.$inferSelect
