import type { SQL } from 'drizzle-orm'

import { and, eq } from 'drizzle-orm'

import { db } from '@/libs/DB'
import { schemas } from '@/models'

import type {
  StripeRowFields,
  SubscriptionStore,
  SubscriptionWriter,
} from './handleStripeEvent'
import type { SubscriptionRow } from './paidAccess'

const { subscriptions, stripeEvents, users } = schemas

type Db = typeof db
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

type RowLookup = Parameters<SubscriptionWriter['findStripeRow']>[0]

const lookupCondition = ({
  stripeSubscriptionId,
  stripeCustomerId,
  userId,
}: RowLookup): SQL | undefined => {
  if (stripeSubscriptionId) {
    return eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)
  }
  if (stripeCustomerId) return eq(subscriptions.stripeCustomerId, stripeCustomerId)
  if (userId) return eq(subscriptions.userId, userId)
  return undefined
}

const writerFor = (tx: Tx): SubscriptionWriter => ({
  findStripeRow: async (lookup) => {
    const condition = lookupCondition(lookup)
    if (!condition) return undefined
    const [row] = await tx
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.source, 'stripe'), condition))
      .limit(1)
    return row
  },
  saveStripeRow: async (userId: string, fields: StripeRowFields) => {
    await tx
      .insert(subscriptions)
      .values({ userId, source: 'stripe', ...fields })
      .onConflictDoUpdate({
        target: [subscriptions.userId, subscriptions.source],
        set: { ...fields, updatedAt: new Date() },
      })
  },
})

// Drizzle connects as postgres and bypasses RLS, so every read here is scoped by the caller
export class SubscriptionRepository implements SubscriptionStore {
  constructor(private database: Db = db) {}

  async findByUserId(userId: string): Promise<SubscriptionRow[]> {
    return this.database
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
  }

  async findByAuthId(authId: string): Promise<SubscriptionRow[]> {
    const rows = await this.database
      .select({ subscription: subscriptions })
      .from(subscriptions)
      .innerJoin(users, eq(users.id, subscriptions.userId))
      .where(eq(users.authId, authId))
    return rows.map(({ subscription }) => subscription)
  }

  // Remembers the Stripe customer made at checkout start, before any subscription exists. An
  // existing Stripe row keeps its state.
  async saveCustomer(userId: string, stripeCustomerId: string): Promise<void> {
    await this.database
      .insert(subscriptions)
      .values({ userId, source: 'stripe', stripeCustomerId, status: 'incomplete' })
      .onConflictDoNothing({ target: [subscriptions.userId, subscriptions.source] })
  }

  async once<T>(
    event: { id: string; type: string },
    work: (writer: SubscriptionWriter) => Promise<T>
  ): Promise<{ result: T } | undefined> {
    return this.database.transaction(async (tx) => {
      // A concurrent redelivery waits on this row's lock, then sees the conflict
      const recorded = await tx
        .insert(stripeEvents)
        .values({ id: event.id, type: event.type })
        .onConflictDoNothing()
        .returning({ id: stripeEvents.id })
      if (!recorded.length) return undefined
      return { result: await work(writerFor(tx)) }
    })
  }
}
