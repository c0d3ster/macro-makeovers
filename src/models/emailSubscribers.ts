import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { emailSubscriberStatusEnum } from './enums'
import { users } from './users'

// The email list. The SQL migration is the source of truth, including RLS (no policies: only
// the server reads or writes it).
export const emailSubscribers = pgTable('email_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Lowercased before insert
  email: varchar('email', { length: 255 }).notNull().unique(),
  status: emailSubscriberStatusEnum('status').notNull().default('pending'),
  // Confirms the address, then unsubscribes it from any email's link
  token: varchar('token', { length: 64 }).notNull().unique(),
  signupPath: varchar('signup_path', { length: 255 }),
  signupSource: varchar('signup_source', { length: 255 }),
  signupMedium: varchar('signup_medium', { length: 255 }),
  signupCampaign: varchar('signup_campaign', { length: 255 }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  confirmationSentAt: timestamp('confirmation_sent_at', { mode: 'date' }),
  confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
  unsubscribedAt: timestamp('unsubscribed_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

