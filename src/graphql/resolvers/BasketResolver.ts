import { GraphQLError } from 'graphql'
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'

import type { GraphQLContext } from '@/graphql/context'
import type { BasketService } from '@/services'

import { JsonScalar, SaveBasketItemsResult, SaveBasketItemsStatus } from '@/graphql/schema'

const STATUS: Record<'invalid' | 'checked' | 'saved', SaveBasketItemsStatus> = {
  invalid: SaveBasketItemsStatus.Invalid,
  checked: SaveBasketItemsStatus.Checked,
  saved: SaveBasketItemsStatus.Saved,
}

// Price items are written over the database owner's connection, which bypasses RLS
const requireOwner = async (ctx: GraphQLContext, action: string): Promise<void> => {
  if (await ctx.isOwner()) return

  throw new GraphQLError(`Only the site owner can ${action}.`, {
    extensions: { code: 'FORBIDDEN' },
  })
}

@Resolver()
export class BasketResolver {
  constructor(private basketService: BasketService) {}

  @Query(() => JsonScalar, {
    description:
      'The price book and the basket lines of every published recipe, as the basket math reads them',
  })
  basketCatalog(): Promise<unknown> {
    return this.basketService.getCatalog()
  }

  @Query(() => JsonScalar, {
    description:
      'Every basket price item with its sizes, price source, and date, in save shape. Owner only.',
  })
  async basketItems(@Ctx() ctx: GraphQLContext): Promise<unknown> {
    await requireOwner(ctx, 'read basket items')
    return this.basketService.listItems()
  }

  @Mutation(() => SaveBasketItemsResult, {
    description:
      'Adds or replaces basket price items by key, and lists the recipe costs that move. dryRun checks without writing. Owner only.',
  })
  async saveBasketItems(
    @Arg('items', () => JsonScalar) items: unknown,
    @Arg('dryRun', () => Boolean, { defaultValue: false }) dryRun: boolean,
    @Ctx() ctx: GraphQLContext
  ): Promise<SaveBasketItemsResult> {
    await requireOwner(ctx, 'save basket items')

    const result = await this.basketService.saveItems(items, { dryRun })
    if (result.status === 'invalid') {
      return { status: STATUS.invalid, keys: [], issues: result.issues, costChanges: [] }
    }
    return {
      status: STATUS[result.status],
      keys: result.keys,
      issues: [],
      costChanges: result.costChanges,
    }
  }
}
