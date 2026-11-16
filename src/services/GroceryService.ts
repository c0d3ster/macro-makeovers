import { eq } from 'drizzle-orm'

import type {
  GroceryHandoff,
  GroceryHandoffOptions,
  GroceryStoreSuggestion,
  SendBasketInput,
} from '@/graphql/schema'
import type { GrocerId, HandoffErrorCode } from '@/libs/grocery'

import { Grocer } from '@/graphql/schema'
import { computeBasket, parseStoredBasket } from '@/libs/basket'
import { db } from '@/libs/DB'
import {
  affiliateDisclosure,
  HandoffError,
  isGrocerId,
  isZip,
  pickDefaultGrocer,
  toHandoffLines,
} from '@/libs/grocery'
import {
  availableGrocers,
  commissionGrocers,
  getGrocerAdapter,
  getKrogerClient,
  groceryTokenSecret,
} from '@/libs/grocery/groceryConfig'
import { hasKrogerConnection } from '@/libs/grocery/krogerSession'
import { logger } from '@/libs/Logger'
import { cartHandoffs, memberGrocer } from '@/models'

import type { BasketService } from './BasketService'

import { GroceryError } from './GroceryError'

// The GraphQL enum and the lib's union hold the same strings, but TypeScript keeps string enums
// apart from literals, so the two cross over through these maps
const TO_GROCER: Record<GrocerId, Grocer> = {
  kroger: Grocer.Kroger,
  walmart: Grocer.Walmart,
  instacart: Grocer.Instacart,
}
const FROM_GROCER: Record<Grocer, GrocerId> = {
  [Grocer.Kroger]: 'kroger',
  [Grocer.Walmart]: 'walmart',
  [Grocer.Instacart]: 'instacart',
}
const toGrocer = (id: GrocerId): Grocer => TO_GROCER[id]

type Remembered = NonNullable<GroceryHandoffOptions['remembered']>

type HandoffLog = {
  userId: string
  grocer: GrocerId
  outcome: 'sent' | 'failed'
  errorCode?: HandoffErrorCode | 'INTERNAL'
  itemCount: number
  unmatchedCount: number
}

export class GroceryService {
  constructor(private basketService: BasketService) {}

  private async remembered(userId: string): Promise<Remembered | undefined> {
    const row = await db.query.memberGrocer.findFirst({
      where: eq(memberGrocer.userId, userId),
    })
    if (!row || !isGrocerId(row.grocer)) return undefined
    return {
      grocer: toGrocer(row.grocer),
      storeId: row.storeId,
      storeName: row.storeName,
      zip: row.zip,
    }
  }

  private async remember(
    userId: string,
    { grocer, storeId, storeName, zip }: SendBasketInput
  ): Promise<void> {
    const values = {
      grocer: FROM_GROCER[grocer],
      storeId: storeId ?? null,
      storeName: storeName ?? null,
      zip: zip && isZip(zip) ? zip : null,
    }
    await db
      .insert(memberGrocer)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: memberGrocer.userId, set: values })
  }

  // Metrics must never break a handoff, so a failed write is only logged
  private async log(entry: HandoffLog): Promise<void> {
    logger.info('Cart handoff', { ...entry })
    try {
      await db.insert(cartHandoffs).values(entry)
    } catch (error) {
      logger.error('Could not log a cart handoff', { error: String(error) })
    }
  }

  async getOptions({
    userId,
    hasPaidAccess,
  }: {
    userId?: string
    hasPaidAccess: boolean
  }): Promise<GroceryHandoffOptions> {
    const available = availableGrocers()
    const secret = groceryTokenSecret()
    const krogerConnected =
      hasPaidAccess && available.includes('kroger') && secret
        ? await hasKrogerConnection(secret)
        : false
    const remembered =
      userId && hasPaidAccess && available.length > 0
        ? await this.remembered(userId).catch((error: unknown) => {
            logger.error('Could not read the remembered grocer', { error: String(error) })
            return undefined
          })
        : undefined
    const rememberedId = remembered ? FROM_GROCER[remembered.grocer] : undefined
    const defaultGrocer = pickDefaultGrocer({ available, remembered: rememberedId })

    return {
      enabled: available.length > 0,
      signedIn: Boolean(userId),
      hasPaidAccess,
      grocers: available.map((id) => ({
        grocer: toGrocer(id),
        connected: id === 'kroger' ? krogerConnected : true,
      })),
      remembered:
        remembered && rememberedId && available.includes(rememberedId) ? remembered : null,
      defaultGrocer: defaultGrocer ? toGrocer(defaultGrocer) : null,
      disclosure: affiliateDisclosure(commissionGrocers(available)),
    }
  }

  // The first-time default by zip: Kroger pickup if a Kroger-family store is near, else Walmart
  async suggestStores(zip: string): Promise<GroceryStoreSuggestion> {
    if (!isZip(zip))
      throw new GroceryError('BAD_USER_INPUT', 'Enter a 5 digit zip code.')
    const available = availableGrocers()
    const client = available.includes('kroger') ? getKrogerClient() : undefined
    const krogerStores = client
      ? await client.findStores(zip).catch((error: unknown) => {
          // Kroger being down shouldn't block picking Walmart or Instacart
          logger.error('Kroger store search failed', { error: String(error) })
          return []
        })
      : []
    const defaultGrocer = pickDefaultGrocer({
      available,
      krogerNearby: krogerStores.length > 0,
    })
    return {
      defaultGrocer: defaultGrocer ? toGrocer(defaultGrocer) : null,
      krogerStores,
    }
  }

  async send(userId: string, input: SendBasketInput): Promise<GroceryHandoff> {
    const grocer = FROM_GROCER[input.grocer]
    const adapter = getGrocerAdapter(grocer)
    if (!adapter)
      throw new GroceryError('GROCER_UNAVAILABLE', 'That grocer is not available right now.')

    // The same checks the browser's saved basket goes through, plus dropping recipes with no
    // basket data, so the server decides what the basket buys
    const catalog = await this.basketService.getCatalog()
    const basket = parseStoredBasket(
      JSON.stringify({
        entries: input.entries,
        includePantry: input.includePantry,
        checked: input.checked,
      }),
      catalog
    )
    const { lines: basketLines } = computeBasket(catalog, basket.entries, {
      includePantry: basket.includePantry,
    })
    const lines = toHandoffLines(basketLines, new Set(basket.checked))
    if (lines.length === 0)
      throw new GroceryError('GROCER_NO_MATCHES', 'Your basket has nothing left to buy.')

    try {
      const result = await adapter.handoff({
        lines,
        ...(input.storeId ? { storeId: input.storeId } : {}),
      })
      await this.log({
        userId,
        grocer,
        outcome: 'sent',
        itemCount: lines.length,
        unmatchedCount: result.unmatched.length,
      })
      await this.remember(userId, input).catch((error: unknown) => {
        logger.error('Could not remember the grocer', { error: String(error) })
      })
      return {
        grocer: toGrocer(result.grocer),
        url: result.url,
        matchedCount: result.matched.length,
        unmatched: result.unmatched.map(({ key, name, display }) => ({ key, name, display })),
      }
    } catch (error) {
      const code = error instanceof HandoffError ? error.code : 'INTERNAL'
      await this.log({
        userId,
        grocer,
        outcome: 'failed',
        errorCode: code,
        itemCount: lines.length,
        unmatchedCount: code === 'GROCER_NO_MATCHES' ? lines.length : 0,
      })
      if (error instanceof HandoffError) throw new GroceryError(error.code, error.message)
      logger.error('Cart handoff failed', { grocer, error: String(error) })
      throw new GroceryError(
        'GROCER_UNAVAILABLE',
        'Something went wrong sending your basket. Copy the list instead, or try again soon.'
      )
    }
  }
}
