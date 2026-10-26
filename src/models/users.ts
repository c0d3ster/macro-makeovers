import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { UserRole } from '@/graphql/schema/user'

import { userRoleEnum } from './enums'

// App-level profile for a Supabase Auth user.
// The SQL migration in supabase/migrations is the source of truth: change it there, then run
// `pnpm run db:pull` and port the result into this file.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authId: uuid('auth_id').notNull().unique(), // auth.users.id, FK enforced in SQL
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

