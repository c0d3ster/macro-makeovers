#!/usr/bin/env node

const { execSync } = require('node:child_process')

// Check if we should run migrations (not on preview builds)
const shouldRunMigrations = process.env.VERCEL_ENV !== 'preview'

if (shouldRunMigrations) {
  console.log('Running database migrations...')
  try {
    execSync('pnpm run db:migrate', { stdio: 'inherit' })
  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  }
} else {
  console.log('Skipping migrations for preview build')
}

console.log('Building Next.js...')
try {
  execSync('pnpm run build:next', { stdio: 'inherit' })
} catch (error) {
  console.error('Build failed:', error.message)
  process.exit(1)
}
