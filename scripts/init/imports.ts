import { readdirSync, readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { join, relative } from 'node:path'

export type UnlistedImport = { file: string; pkg: string }

const SOURCE_FILE = /\.(?:ts|tsx|js|jsx|mjs|cjs|mts)$/
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'coverage', 'out', 'supabase', 'variants'])
// The engine's own sources and tests contain import-like text in fixtures
const SKIP_PATHS = new Set(['scripts/init'])
const IMPORT = /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)['"]([^'"\n]+)['"]/g

// "@scope/pkg/deep" -> "@scope/pkg", "pkg/deep" -> "pkg", relative paths, aliases
// and Node built-ins -> undefined
export const packageName = (specifier: string): string | undefined => {
  const local = ['.', '/', '@/', 'node:'].some((prefix) => specifier.startsWith(prefix))
  if (local) return undefined

  const [first = '', second = ''] = specifier.split('/')
  const name = specifier.startsWith('@') ? `${first}/${second}` : first
  return builtinModules.includes(name) ? undefined : name
}

const walk = (dir: string, root: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    const rel = relative(root, full).split('\\').join('/')
    if (entry.isDirectory()) {
      return SKIP_DIRS.has(entry.name) || SKIP_PATHS.has(rel) ? [] : walk(full, root)
    }
    return SOURCE_FILE.test(entry.name) ? [full] : []
  })

// Imports of packages that package.json no longer lists. Run after init prunes packages:
// a module's files can be removed while a shared file still imports its package.
export const findUnlistedImports = (root: string): UnlistedImport[] => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const listed = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ])

  const found = new Map<string, UnlistedImport>()
  walk(root, root).forEach((file) => {
    const text = readFileSync(file, 'utf8')
    Array.from(text.matchAll(IMPORT)).forEach((match) => {
      const name = packageName(match[1] ?? '')
      if (!name || listed.has(name)) return
      const label = relative(root, file).split('\\').join('/')
      found.set(`${label}|${name}`, { file: label, pkg: name })
    })
  })

  return Array.from(found.values()).sort((a, b) => `${a.file}${a.pkg}`.localeCompare(`${b.file}${b.pkg}`))
}
