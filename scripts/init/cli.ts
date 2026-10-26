import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { ModuleId } from './modules'

import { applySelection } from './apply'
import { selectableIds } from './modules'
import { resolveSelection } from './select'
import { getModules, resolveVariant, variantIds, variants } from './variants'

type Args = {
  features?: string[]
  variant?: string
  dryRun: boolean
  skipInstall: boolean
  skipFormat: boolean
  keepTooling: boolean
  strict: boolean
  root: string
}

const USAGE = `Usage: pnpm bootstrap --features=<list> [options]

  --features=a,b,c   Features to keep (${selectableIds.join(', ')}).
                     Unknown ids (design, seo, ...) are ignored.
                     Use --features= to keep none.
  --variant=<name>   Provider behind auth and database: ${variantIds.join(' or ')}.
                     Defaults to clerk-neon, or supabase when a feature needs it (realtime).
  --config=<file>    JSON file: { "features": ["database", "auth"], "variant": "supabase" }
  --dry-run          Print what would change without touching anything
  --skip-install     Do not refresh pnpm-lock.yaml
  --skip-format      Do not run prettier on changed files
  --keep-tooling     Keep the init scripts (for working on the template itself)
  --strict           Exit with an error if a kept file imports a package that was pruned
  --root=<dir>       Project root (defaults to the current directory)
`

const parseFeatures = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

type Config = { features: string[]; variant?: string }

const readConfig = (path: string): Config => {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  const record = typeof parsed === 'object' && parsed !== null ? parsed : {}
  const features = 'features' in record ? record.features : undefined
  const variant = 'variant' in record ? record.variant : undefined

  if (!Array.isArray(features) || !features.every((item) => typeof item === 'string')) {
    throw new Error(`${path}: expected { "features": string[] }`)
  }
  if (variant !== undefined && typeof variant !== 'string') {
    throw new Error(`${path}: "variant" must be a string`)
  }
  return { features, variant }
}

const parseArgs = (argv: string[]): Args => {
  const args: Args = {
    dryRun: false,
    skipInstall: false,
    skipFormat: false,
    keepTooling: false,
    strict: false,
    root: process.cwd(),
  }

  argv.forEach((arg) => {
    // npm-style `-- --flag` still works
    if (arg === '--') return
    const [flag, ...rest] = arg.split('=')
    const value = rest.join('=')
    if (flag === '--features') args.features = parseFeatures(value)
    else if (flag === '--variant') args.variant = value
    else if (flag === '--config') {
      const config = readConfig(resolve(value))
      args.features = config.features
      args.variant = args.variant ?? config.variant
    } else if (flag === '--root') args.root = resolve(value)
    else if (flag === '--dry-run') args.dryRun = true
    else if (flag === '--skip-install') args.skipInstall = true
    else if (flag === '--skip-format') args.skipFormat = true
    else if (flag === '--keep-tooling') args.keepTooling = true
    else if (flag === '--strict') args.strict = true
    else throw new Error(`Unknown option: ${arg}\n\n${USAGE}`)
  })

  return args
}

const say = (message: string): void => {
  process.stdout.write(`${message}\n`)
}

const main = (): void => {
  const args = parseArgs(process.argv.slice(2))

  if (args.features === undefined) {
    process.stdout.write(USAGE)
    process.exit(1)
  }

  const variantId = resolveVariant(args.variant, args.features)
  const variant = variants[variantId]
  const defs = getModules(variantId)
  const selection = resolveSelection(args.features, defs, variantId)

  if (selection.ignored.length > 0) {
    say(`Ignoring features with no template code: ${selection.ignored.join(', ')}`)
  }
  if (selection.added.length > 0) {
    say(`Also keeping (required by your selection): ${selection.added.join(', ')}`)
  }

  const kept = (Object.keys(defs) as ModuleId[])
    .filter((id) => selection.enabled.has(id))
    .join(', ')
  say(`Variant: ${variant.label}`)
  say(`Keeping: ${kept || 'nothing (base template only)'}\n`)

  const unlisted = applySelection({
    root: args.root,
    selection,
    variant,
    defs,
    dryRun: args.dryRun,
    skipInstall: args.skipInstall,
    skipFormat: args.skipFormat,
    keepTooling: args.keepTooling,
    log: (message) => say(`  ${message}`),
  })

  say(args.dryRun ? '\nDry run, nothing changed.' : '\nDone. Run `pnpm install` to refresh node_modules.')

  if (unlisted.length > 0) {
    say('\nThese files import packages that are no longer in package.json:')
    unlisted.forEach(({ file, pkg }) => say(`  ${file}: ${pkg}`))
    if (args.strict) process.exit(1)
  }
}

try {
  main()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
}
