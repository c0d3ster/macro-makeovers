// Starts the dev server and the codegen watcher on the same port. When 3000 (or PORT) is taken,
// it moves up to the next free one and hands that to both, so codegen never polls another app.
// When the app points at a local Supabase stack that is not running, it starts it first, so pages
// don't hang on auth retries. That needs Docker running.
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

const ensureLocalSupabase = async (): Promise<void> => {
  const url = readEnvValue('NEXT_PUBLIC_SUPABASE_URL')
  if (!isLocalSupabase(url) || (await isReachable(url))) return

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
}

const main = async (): Promise<void> => {
  await ensureLocalSupabase()

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
