// Starts the dev server and the codegen watcher on the same port. When 3000 (or PORT) is taken,
// it moves up to the next free one and hands that to both, so codegen never polls another app.
// When the app points at a local Supabase stack that is not running, it starts it first, so pages
// don't hang on auth retries (that needs Docker running), then applies any migrations the local
// database hasn't run yet.
import type { Buffer } from 'node:buffer'

import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:net'

const FIRST_PORT = Number(process.env.PORT ?? 3000)
const MAX_TRIES = 20

// The env files Next reads in dev, highest priority first
const ENV_FILES = ['.env.development.local', '.env.local', '.env.development', '.env']
const LOCAL_HOSTS = ['127.0.0.1', 'localhost']
const SUPABASE_CONFIG = 'supabase/config.toml'

const isFree = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port)
  })

const findPort = async (port: number, triesLeft: number): Promise<number> => {
  if (triesLeft === 0) throw new Error(`No free port from ${FIRST_PORT}`)
  if (await isFree(port)) return port
  return findPort(port + 1, triesLeft - 1)
}

// Runs a command to the end and resolves its exit code
const run = (command: string, args: string[], quiet = false): Promise<number> =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: quiet ? 'ignore' : 'inherit',
      shell: true,
    })
    child.on('error', () => resolve(1))
    child.on('exit', (code) => resolve(code ?? 1))
  })

const unquote = (value: string): string => value.trim().replace(/^['"]|['"]$/g, '')

// This runs before Next loads the env files, so read the one value it needs the same way
const readEnvValue = (key: string): string | undefined => {
  const fromProcess = process.env[key]
  if (fromProcess) return fromProcess

  const pattern = new RegExp(`^${key}=(.*)$`, 'm')
  return ENV_FILES.filter((file) => existsSync(file))
    .map((file) => readFileSync(file, 'utf8').match(pattern)?.[1])
    .map((value) => (value ? unquote(value) : undefined))
    .find((value) => Boolean(value))
}

const isLocalSupabase = (url: string | undefined): url is string =>
  Boolean(url) &&
  URL.canParse(url ?? '') &&
  LOCAL_HOSTS.includes(new URL(url ?? '').hostname) &&
  existsSync(SUPABASE_CONFIG)

// Any HTTP answer means the stack is up, even an auth error
const isReachable = (url: string): Promise<boolean> =>
  fetch(`${url}/auth/v1/health`, { signal: AbortSignal.timeout(2000) })
    .then(() => true)
    .catch(() => false)

type CaptureResult = { code: number; output: string }

// Runs a command to the end and resolves its exit code and everything it printed
const capture = (command: string, args: string[]): Promise<CaptureResult> =>
  new Promise((resolve) => {
    const child = spawn(command, args, { shell: true })
    const chunks: string[] = []
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => chunks.push(chunk.toString()))
    child.on('error', (error) => resolve({ code: 1, output: String(error) }))
    child.on('exit', (code) => resolve({ code: code ?? 1, output: chunks.join('') }))
  })

type MigrationResult = { applied: string[] }

const isMigrationResult = (value: unknown): value is MigrationResult =>
  typeof value === 'object' &&
  value !== null &&
  'applied' in value &&
  Array.isArray(value.applied) &&
  value.applied.every((item) => typeof item === 'string')

// The CLI prints its result as one JSON object, next to a plain text target line
const parseApplied = (output: string): string[] => {
  const json = output.match(/\{[\s\S]*\}/)?.[0]
  if (!json) return []
  try {
    const parsed: unknown = JSON.parse(json)
    return isMigrationResult(parsed) ? parsed.applied : []
  } catch {
    return []
  }
}

// A local database misses migrations merged after it was created, and the app then fails on
// the missing tables. This applies only the pending ones and never resets data.
const applyLocalMigrations = async (): Promise<void> => {
  const { code, output } = await capture('pnpm', ['exec', 'supabase', 'migration', 'up'])
  if (code !== 0) {
    console.error(`\nCould not apply local migrations:\n${output}\n`)
    process.exit(1)
  }

  const applied = parseApplied(output).map((path) => path.split(/[\\/]/).pop())
  if (applied.length > 0) {
    console.log(`Applied ${applied.length} local migration(s):\n  ${applied.join('\n  ')}`)
  }
}

// Starts the local stack when the app uses one. Resolves whether a local stack is in use.
const ensureLocalSupabase = async (): Promise<boolean> => {
  const url = readEnvValue('NEXT_PUBLIC_SUPABASE_URL')
  if (!isLocalSupabase(url)) return false
  if (await isReachable(url)) return true

  if ((await run('docker', ['info'], true)) !== 0) {
    console.error(
      `\nLocal Supabase (${url}) is not running, and Docker is not up to start it.\n` +
        'Start Docker Desktop, then run pnpm dev again.\n'
    )
    process.exit(1)
  }

  console.log('Local Supabase is not running. Starting it...')
  if ((await run('pnpm', ['exec', 'supabase', 'start'])) !== 0) {
    console.error('\nCould not start local Supabase. See the output above.\n')
    process.exit(1)
  }
  return true
}

const main = async (): Promise<void> => {
  if (await ensureLocalSupabase()) await applyLocalMigrations()

  const port = await findPort(FIRST_PORT, MAX_TRIES)
  if (port !== FIRST_PORT) console.log(`Port ${FIRST_PORT} is in use, using ${port}`)

  const child = spawn('pnpm', ['exec', 'run-p', 'dev:next', 'codegen:watch'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: String(port) },
  })
  child.on('exit', (code) => process.exit(code ?? 0))
}

void main()
