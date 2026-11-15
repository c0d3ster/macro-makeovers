import {
  boolean,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

import { subscriptionSourceEnum, subscriptionStatusEnum } from './enums'
import { users } from './users'

// The SQL migration in supabase/migrations is the source of truth (RLS, the updated_at trigger,
// the check constraint, and public.has_paid_access). Change it there, run `pnpm run db:pull`,
// and port the result.

// One row per user per entitlement source. Stripe today, a partner grant later.
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    source: subscriptionSourceEnum('source').notNull().default('stripe'),
    stripeCustomerId: text('stripe_customer_id').unique(),
    stripeSubscriptionId: text('stripe_subscription_id').unique(),
    status: subscriptionStatusEnum('status').notNull(),
    currentPeriodEnd: timestamp('current_period_end', {
      withTimezone: true,
      mode: 'date',
    }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    pastDueSince: timestamp('past_due_since', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique().on(table.userId, table.source)]
)

// Stripe events already handled, so a redelivery is a no-op
export const stripeEvents = pgTable('stripe_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})
