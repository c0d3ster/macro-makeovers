// Imports recipe JSON files into Supabase.
//
//   pnpm recipe:import content/recipes            # a folder of .json files
//   pnpm recipe:import path/to/recipe.json        # one file
//   pnpm recipe:import content/recipes --dry-run  # validate and diff, write nothing
//   pnpm recipe:import content/recipes --overwrite
//
// Writes with the service role key from .env.local, against the URL in .env (the local
// Docker stack). To import into the hosted project, set both for one command:
//   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=... pnpm recipe:import ...
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

import type { ImportResult } from '@/libs/recipes'

import { createSupabaseRecipeStore, importRecipe } from '@/libs/recipes'
import { createAdminClient } from '@/libs/supabase/admin'

const FLAGS = ['--overwrite', '--dry-run']

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
      'Usage: pnpm recipe:import <file-or-folder>... [--overwrite] [--dry-run]'
    )
    process.exit(1)
  }

  const options = {
    overwrite: args.includes('--overwrite'),
    dryRun: args.includes('--dry-run'),
  }
  const store = createSupabaseRecipeStore(createAdminClient())
  const files = targets.flatMap(collectFiles)
  if (files.length === 0) {
    console.error('No .json files found')
    process.exit(1)
  }

  // A variant needs its base to exist first, so bases go in ahead of variants
  const inputs = files
    .map((file) => ({
      file,
      input: readJson(file),
    }))
    .sort((a, b) => Number(isVariant(a.input)) - Number(isVariant(b.input)))

  let failed = 0
  for (const { file, input } of inputs) {
    const result = await importRecipe(store, input, options)

    describe(file, result).forEach((line) => console.log(line))

    if (result.status === 'invalid' || result.status === 'conflict') failed += 1
  }

  if (options.dryRun) console.log('\nDry run: nothing was written')
  if (failed > 0) {
    console.error(`\n${failed} of ${inputs.length} recipes were not imported`)
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
