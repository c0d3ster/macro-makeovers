import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { revalidatePath } from 'next/cache'

import type { BasketCatalog } from '@/libs/basket'
import type { BasketItemRecord } from '@/libs/basket/BasketRepository'
import type { schemas } from '@/models'

import { costPerServing, toCatalogItem } from '@/libs/basket'
import { BasketRepository } from '@/libs/basket/BasketRepository'
import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { revalidateRecipePages } from '@/libs/recipes/revalidateRecipePages'
import { basketItemsSchema } from '@/validations'

type Issue = {
  path: string
  message: string
}

// A recipe build whose cost per serving moves with a price change
export type CostChange = {
  slug: string
  // Missing for the recipe's own lines
  build?: string
  before: number
  after: number
}

export type SaveItemsResult =
  | { status: 'invalid'; issues: Issue[] }
  | { status: 'saved' | 'checked'; keys: string[]; costChanges: CostChange[] }

type SaveItemsOptions = {
  // Validate and show the cost changes without writing anything
  dryRun: boolean
}

const formatPath = (path: PropertyKey[]): string =>
  path.reduce<string>((result, part) => {
    if (typeof part === 'number') return `${result}[${part}]`
    return result ? `${result}.${String(part)}` : String(part)
  }, '')

// Every recipe and changed build priced per serving, keyed "slug" or "slug build"
const pricesOf = (catalog: BasketCatalog, slugs: Set<string>): Map<string, number> =>
  new Map(
    catalog.recipes
      .filter(({ slug }) => slugs.has(slug))
      .flatMap(({ slug, servings, builds = {} }) => [
        [slug, costPerServing(catalog, [{ slug, servings }])] as const,
        ...Object.keys(builds).map(
          (build) =>
            [`${slug} ${build}`, costPerServing(catalog, [{ slug, servings, build }])] as const
        ),
      ])
  )

// The basket's price book and recipe lines. Reads for the public only see published recipes.
// Writes go over the database owner's connection, which bypasses RLS, so the resolver checks
// the owner first.
export class BasketService {
  constructor(private database: NodePgDatabase<typeof schemas> = db) {}

  private repository(): BasketRepository {
    return new BasketRepository(this.database)
  }

  // Published recipes only, for the basket page, the home page, and sending to a grocer
  getCatalog(): Promise<BasketCatalog> {
    return this.repository().getCatalog()
  }

  // Owner reads

  listItems(): Promise<BasketItemRecord[]> {
    return this.repository().listItems()
  }

  // Adds or replaces price items by key. Lists every recipe and build whose cost per serving
  // moves by at least a cent, drafts included, so a price change never surprises.
  async saveItems(input: unknown, { dryRun }: SaveItemsOptions): Promise<SaveItemsResult> {
    const parsed = basketItemsSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: 'invalid',
        issues: parsed.error.issues.map(({ path, message }) => ({
          path: formatPath(path),
          message,
        })),
      }
    }

    const items = parsed.data
    const keys = items.map(({ key }) => key)
    const repository = this.repository()
    const before = await repository.getCatalog({ includeDrafts: true })
    const after: BasketCatalog = {
      ...before,
      items: {
        ...before.items,
        ...Object.fromEntries(items.map((item) => [item.key, toCatalogItem(item)])),
      },
    }
    const affected = new Set(await repository.listSlugsUsingItems(keys))
    const was = pricesOf(before, affected)
    const costChanges = [...pricesOf(after, affected).entries()].flatMap(
      ([id, cost]): CostChange[] => {
        const old = was.get(id) ?? 0
        if (Math.abs(cost - old) < 0.005) return []
        const [slug = id, build] = id.split(' ')
        return [{ slug, ...(build ? { build } : {}), before: old, after: cost }]
      }
    )

    if (dryRun) return { status: 'checked', keys, costChanges }

    await repository.saveItems(items)
    try {
      revalidatePath('/basket')
      affected.forEach(revalidateRecipePages)
    } catch (error) {
      logger.warn('Could not refresh pages after saving basket items', {
        error: String(error),
      })
    }
    return { status: 'saved', keys, costChanges }
  }
}
