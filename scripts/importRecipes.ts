// Imports recipe JSON files into the database over Drizzle.
//
//   pnpm recipe:import content/recipes            # a folder of .json files
//   pnpm recipe:import path/to/recipe.json        # one file
//   pnpm recipe:import content/recipes --dry-run  # validate and diff, write nothing
//   pnpm recipe:import content/recipes --overwrite
//   pnpm recipe:import content/recipes --publish  # also publish what was imported or unchanged
//
// Connects with DATABASE_URL from .env (the local Docker stack), or from .env.local if set.
// To import into the hosted project use `pnpm recipe:import:prod`, which reads
// .env.production and then .env.production.local (gitignored), where DATABASE_URL should be
// the direct connection string from the Supabase dashboard. Same arguments as above.
import 'reflect-metadata'
import { inArray } from 'drizzle-orm'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

import type { ImportResult } from '@/libs/recipes'

import { closeDb, db } from '@/libs/DB'
import { importRecipe } from '@/libs/recipes'
import { RecipeRepository } from '@/libs/recipes/RecipeRepository'
import { recipes } from '@/models'

const FLAGS = ['--overwrite', '--dry-run', '--publish']

const collectFiles = (target: string): string[] => {
  const path = resolve(target)
  if (!statSync(path).isDirectory()) return [path]
  return readdirSync(path)
    .filter((name) => extname(name) === '.json')
    .sort()
    .map((name) => join(path, name))
}

const readJson = (file: string): unknown =>
  JSON.parse(readFileSync(file, 'utf8'))

const isVariant = (input: unknown): boolean =>
  typeof input === 'object' && input !== null && 'variantOf' in input

// A recipe that uses sides or sauces needs them to exist first
const usesComponents = (input: unknown): boolean =>
  typeof input === 'object' &&
  input !== null &&
  'components' in input &&
  Array.isArray(input.components) &&
  input.components.length > 0

// Sides and sauces first, then dishes that use them, then variants
const importRank = (input: unknown): number =>
  Number(usesComponents(input)) + 2 * Number(isVariant(input))

const formatValue = (value: unknown): string =>
  value === undefined ? '(none)' : JSON.stringify(value)

const describe = (file: string, result: ImportResult): string[] => {
  switch (result.status) {
    case 'invalid':
      return [
        `invalid  ${file}`,
        ...result.issues.map(({ path, message }) => `  ${path}: ${message}`),
      ]
    case 'created':
      return [`created  ${result.slug}`]
    case 'unchanged':
      return [`same     ${result.slug}`]
    case 'updated':
      return [
        `updated  ${result.slug}`,
        ...result.changes.map(
          ({ path, before, after }) =>
            `  ${path}: ${formatValue(before)} -> ${formatValue(after)}`
        ),
      ]
    case 'conflict':
      return [
        `exists   ${result.slug} (use --overwrite to replace)`,
        ...result.changes.map(
          ({ path, before, after }) =>
            `  ${path}: ${formatValue(before)} -> ${formatValue(after)}`
        ),
      ]
  }
}

const main = async (): Promise<void> => {
  const args = process.argv.slice(2)
  const targets = args.filter((arg) => !arg.startsWith('--'))
  const unknownFlags = args.filter(
    (arg) => arg.startsWith('--') && !FLAGS.includes(arg)
  )
  if (targets.length === 0 || unknownFlags.length > 0) {
    console.error(
      'Usage: pnpm recipe:import <file-or-folder>... [--overwrite] [--dry-run] [--publish]'
    )
    process.exit(1)
  }

  const options = {
    overwrite: args.includes('--overwrite'),
    dryRun: args.includes('--dry-run'),
  }
  const publish = args.includes('--publish')
  const repository = new RecipeRepository(db)
  const files = targets.flatMap(collectFiles)
  if (files.length === 0) {
    console.error('No .json files found')
    process.exit(1)
  }

  // A variant needs its base to exist first, and a dish its sides and sauces
  const inputs = files
    .map((file) => ({
      file,
      input: readJson(file),
    }))
    .sort((a, b) => importRank(a.input) - importRank(b.input))

  let failed = 0
  const publishable: string[] = []
  for (const { file, input } of inputs) {
    const result = await importRecipe(repository, input, options)

    describe(file, result).forEach((line) => console.log(line))

    if (result.status === 'invalid' || result.status === 'conflict') failed += 1
    else publishable.push(result.slug)
  }

  if (publish && !options.dryRun && publishable.length > 0) {
    await db
      .update(recipes)
      .set({ status: 'published' })
      .where(inArray(recipes.slug, publishable))
    console.log(`\nPublished ${publishable.length} recipes`)
  }

  if (options.dryRun) console.log('\nDry run: nothing was written')
  if (failed > 0) {
    console.error(`\n${failed} of ${inputs.length} recipes were not imported`)
    process.exit(1)
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    // Lets the process exit
    await closeDb()
  })
