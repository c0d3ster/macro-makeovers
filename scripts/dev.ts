// Starts the dev server and the codegen watcher on the same port. When 3000 (or PORT) is taken,
// it moves up to the next free one and hands that to both, so codegen never polls another app.
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

const FIRST_PORT = Number(process.env.PORT ?? 3000)
const MAX_TRIES = 20

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

const main = async (): Promise<void> => {
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
