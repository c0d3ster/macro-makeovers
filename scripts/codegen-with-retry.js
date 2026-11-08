#!/usr/bin/env node

const { spawn } = require('node:child_process')
const { setTimeout } = require('node:timers/promises')

// Same port as the dev server, which `pnpm dev` passes in
const GRAPHQL_URL = `http://localhost:${process.env.PORT ?? 3000}/api/graphql`

async function waitForServer(url, maxAttempts = 30, delay = 1000) {
  console.log(`🔄 Waiting for server at ${url}...`)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: '{ __typename }' }),
      })

      if (response.ok) {
        console.log(`✅ Server is ready after ${attempt} attempts`)
        return true
      }
    } catch {
      // Server not ready, continue waiting
    }

    if (attempt < maxAttempts) {
      console.log(
        `⏳ Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`
      )
      await setTimeout(delay)
    }
  }

  console.log(`❌ Server did not become ready after ${maxAttempts} attempts`)
  return false
}

async function runCodegen() {
  console.log('🚀 Starting codegen with server check...')

  // Wait for server to be ready
  const serverReady = await waitForServer(GRAPHQL_URL)

  if (!serverReady) {
    console.error('❌ Server is not ready, codegen cannot proceed')
    process.exit(1)
  }

  // Run GraphQL codegen
  console.log('🔧 Running GraphQL codegen...')
  const codegen = spawn('npx', ['graphql-codegen'], {
    stdio: 'inherit',
    shell: true,
  })

  codegen.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Codegen completed successfully')
    } else {
      console.error(`❌ Codegen failed with exit code ${code}`)
    }
    process.exit(code)
  })
}

async function runCodegenWatch() {
  console.log('🚀 Starting codegen watch with server check...')

  // Wait for server to be ready
  const serverReady = await waitForServer(GRAPHQL_URL)

  if (!serverReady) {
    console.error('❌ Server is not ready, codegen cannot proceed')
    process.exit(1)
  }

  // Run GraphQL codegen in watch mode
  console.log('👀 Running GraphQL codegen in watch mode...')
  const codegen = spawn('npx', ['graphql-codegen', '--watch'], {
    stdio: 'inherit',
    shell: true,
  })

  codegen.on('close', (code) => {
    console.log(`Codegen watch exited with code ${code}`)
    process.exit(code)
  })
}

// Check command line argument
const isWatch = process.argv.includes('--watch')

if (isWatch) {
  runCodegenWatch().catch(console.error)
} else {
  runCodegen().catch(console.error)
}
