// Writes the seed basket data in content/ to a database: the price book in
// content/basket/items.json, and the basketLines of recipes that already exist there, without
// re-importing the recipes themselves (the database is the source of truth for recipes, and the
// seed files can be behind it). A dry run by default: it prints what would change and what each
// recipe build would cost per serving, and writes nothing.
//
//   pnpm basket:sync                                  # dry run against .env (local)
//   pnpm basket:sync --apply                          # write it
//   pnpm basket:sync --lines content/basket/lines/2026-11-16.json
//   pnpm basket:sync:prod                             # dry run against .env.production
//
// --lines adds a file of basket lines for recipes that live only in the database, shaped
// { "slug": { "basketLines": {...}, "builds": { "build-key": {...} } } }. A recipe in it wins
// over its seed file.
//
// On a fresh local database, run this first (it saves the items, and skips recipes it cannot
// find), then `pnpm recipe:import content/recipes`, which brings the seed lines with each recipe.
import 'reflect-metadata'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

import type { BasketItemInput, RecipeImport } from '@/validations'

import { formatMoney, priceRecipe, toCatalogItem } from '@/libs/basket'
import { BasketRepository } from '@/libs/basket/BasketRepository'
import { readContentItems, readContentRecipes } from '@/libs/basket/contentCatalog'
import { closeDb, db } from '@/libs/DB'
import { RecipeRepository } from '@/libs/recipes/RecipeRepository'
import { basketItemKeySchema, recipeImportSchema, recipeSlugSchema } from '@/validations'

const FLAGS = ['--apply', '--lines']
const TIERS = ['$', '$$', '$$$', '$$$$', '$$$$$']

const linesSchema = z.record(basketItemKeySchema, z.number().min(0))
const linesFileSchema = z.record(
  recipeSlugSchema,
  z.object({
    basketLines: linesSchema,
    builds: z.record(recipeSlugSchema, linesSchema).default({}),
  })
)

type RecipeLines = {
  lines: Record<string, number>
  builds: Record<string, Record<string, number>>
}

// Key order differs between the seed files and the database, so it is sorted away
const stable = (value: unknown): string =>
  JSON.stringify(value, (_, inner: unknown) =>
    typeof inner === 'object' && inner !== null && !Array.isArray(inner)
      ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => a.localeCompare(b)))
      : inner
  )

const sameJson = (a: unknown, b: unknown): boolean => stable(a) === stable(b)

// Fields compared one by one, so the output says what changed
const itemChanges = (before: BasketItemInput, after: BasketItemInput): string[] =>
  (Object.keys(after) as (keyof BasketItemInput)[]).flatMap((field) => {
    const was = JSON.stringify(before[field] ?? null)
    const now = JSON.stringify(after[field] ?? null)
    return was === now ? [] : [`${field}: ${was} -> ${now}`]
  })

const linesFromSeeds = (seeds: RecipeImport[]): Map<string, RecipeLines> =>
  new Map(
    seeds.flatMap((recipe) =>
      recipe.basketLines
        ? [
            [
              recipe.slug,
              {
                lines: recipe.basketLines,
                builds: Object.fromEntries(
                  recipe.builds.flatMap(({ key, basketLines }) =>
                    basketLines ? [[key, basketLines]] : []
                  )
                ),
              },
            ] as const,
          ]
        : []
    )
  )

const readLinesFile = (path: string): Map<string, RecipeLines> => {
  const parsed = linesFileSchema.parse(
    JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'))
  )
  return new Map(
    Object.entries(parsed).map(([slug, { basketLines, builds }]) => [
      slug,
      { lines: basketLines, builds },
    ])
  )
}

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)
  const linesIndex = args.indexOf('--lines')
  const linesPath = linesIndex >= 0 ? args[linesIndex + 1] : undefined
  const unknownFlags = args.filter((arg) => arg.startsWith('--') && !FLAGS.includes(arg))
  if (unknownFlags.length > 0 || (linesIndex >= 0 && !linesPath)) {
    console.error('Usage: pnpm basket:sync [--lines <file>] [--apply]')
    process.exit(1)
  }
  const apply = args.includes('--apply')

  const baskets = new BasketRepository(db)
  const recipes = new RecipeRepository(db)

  // Items: new, changed, or the same
  const items = readContentItems()
  const stored = new Map((await baskets.listItems()).map((item) => [item.key, item]))
  const toSave = items.filter((item) => {
    const before = stored.get(item.key)
    if (!before) {
      console.log(`item new      ${item.key}  ${item.pack}  ${formatMoney(item.price)}`)
      return true
    }
    const changes = itemChanges(before, item)
    if (changes.length === 0) return false
    console.log(`item changed  ${item.key}`)
    changes.forEach((change) => console.log(`  ${change}`))
    return true
  })
  console.log(`${toSave.length} of ${items.length} items to save\n`)

  // Lines for recipes that exist, each checked against its stored copy and priced
  const wanted = new Map([
    ...linesFromSeeds(readContentRecipes()),
    ...(linesPath ? readLinesFile(linesPath) : []),
  ])
  const prices = {
    ...Object.fromEntries([...stored.entries()].map(([key, item]) => [key, toCatalogItem(item)])),
    ...Object.fromEntries(items.map((item) => [item.key, toCatalogItem(item)])),
  }
  const toWrite: [string, RecipeLines][] = []
  let problems = 0

  for (const [slug, { lines, builds }] of [...wanted.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    const id = await recipes.getRecipeIdBySlug(slug)
    if (!id) {
      console.log(`skip     ${slug} (not in this database)`)
      continue
    }
    const parsed = recipeImportSchema.safeParse(await recipes.getRecipe(id))
    if (!parsed.success) {
      console.log(`invalid  ${slug}: stored recipe no longer matches the import schema`)
      problems += 1
      continue
    }
    const current = parsed.data
    const unknownBuild = Object.keys(builds).find(
      (key) => !current.builds.some((build) => build.key === key)
    )
    if (unknownBuild) {
      console.log(`invalid  ${slug}: no build has the key "${unknownBuild}"`)
      problems += 1
      continue
    }
    const missingItem = [lines, ...Object.values(builds)]
      .flatMap((changes) => Object.keys(changes))
      .find((key) => !prices[key])
    if (missingItem) {
      console.log(`invalid  ${slug}: no basket item has the key "${missingItem}"`)
      problems += 1
      continue
    }

    // The recipe as it would read after the sync, rounded the way the import stores it
    const next = recipeImportSchema.parse({
      ...current,
      basketLines: lines,
      builds: current.builds.map(({ basketLines: _old, ...build }) => ({
        ...build,
        ...(builds[build.key] ? { basketLines: builds[build.key] } : {}),
      })),
    })
    const storedBuilds = Object.fromEntries(
      current.builds.flatMap(({ key, basketLines }) => (basketLines ? [[key, basketLines]] : []))
    )
    const nextBuilds = Object.fromEntries(
      next.builds.flatMap(({ key, basketLines }) => (basketLines ? [[key, basketLines]] : []))
    )
    const unchanged =
      sameJson(current.basketLines ?? {}, next.basketLines ?? {}) &&
      sameJson(storedBuilds, nextBuilds)

    console.log(`${unchanged ? 'same    ' : 'lines   '} ${slug}`)
    const { prices: costs, warnings } = priceRecipe(prices, next)
    costs.forEach(({ build, perServing, tier, statedTier }) =>
      console.log(
        `  ${build}: ${formatMoney(perServing)}/serving ${TIERS[tier - 1]}${tier === statedTier ? '' : ` (says ${TIERS[statedTier - 1]})`}`
      )
    )
    warnings.forEach(({ message }) => console.log(`  warning: ${message}`))
    if (!unchanged) {
      toWrite.push([slug, { lines: next.basketLines ?? {}, builds: nextBuilds }])
    }
  }
  console.log(`\n${toWrite.length} recipes with lines to write`)

  if (problems > 0) {
    console.error(`${problems} recipes have problems. Fix them before applying.`)
    process.exit(1)
  }
  if (!apply) {
    console.log('Dry run: nothing was written. Add --apply to write it.')
    return
  }

  if (toSave.length > 0) await baskets.saveItems(toSave)
  for (const [slug, { lines, builds }] of toWrite) {
    await baskets.replaceRecipeLines(slug, lines, builds)
  }
  console.log(`Saved ${toSave.length} items and lines for ${toWrite.length} recipes`)
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
  })
