import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { users } from './users'

// The SQL migration (supabase/migrations/20261115000000_create_grocery_handoff.sql) is the source
// of truth. Grocer columns are text with a check constraint there.

// The member's last grocer and store, preselected next time (PRD 05)
export const memberGrocer = pgTable('member_grocer', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  grocer: text('grocer').notNull(),
  storeId: text('store_id'),
  storeName: text('store_name'),
  zip: text('zip'),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// One row per "Send to cart", for handoffs and unmatched lines by grocer
export const cartHandoffs = pgTable(
  'cart_handoffs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    grocer: text('grocer').notNull(),
    outcome: text('outcome').notNull(),
    errorCode: text('error_code'),
    itemCount: integer('item_count').notNull(),
    unmatchedCount: integer('unmatched_count').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [index('cart_handoffs_grocer_idx').on(table.grocer, table.createdAt)]
)
