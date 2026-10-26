import 'reflect-metadata'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Buffer } from 'node:buffer'
import * as React from 'react'
import { afterEach, beforeEach, vi } from 'vitest'

// =============================================================================
// ENVIRONMENT POLYFILLS
// =============================================================================
// Required for test environment to work in browser-like conditions

// Set Buffer for browser environment with full polyfill
// eslint-disable-next-line node/prefer-global/buffer
if (typeof globalThis.Buffer === 'undefined') {
  // eslint-disable-next-line node/prefer-global/buffer
  globalThis.Buffer = Buffer
}

// Mock process if it doesn't exist (for Node.js compatibility)
if (typeof process === 'undefined') {
  globalThis.process = {
    env: {},
    cwd: () => '',
    platform: 'browser',
  } as any
}

// Mock __dirname for browser environment
if (typeof __dirname === 'undefined') {
  globalThis.__dirname = '/'
}

// =============================================================================
// APPLICATION MOCKS
// =============================================================================
// Mocks for application-specific utilities used across multiple test files

// Mock Logger utility - tests verify that logging calls happen with specific messages
// Used in: 8+ service and component test files
vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock Toast utility - tests verify that toast calls happen with specific messages
// Used in: 4+ component test files
vi.mock('@/libs/Toast', () => ({
  Toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// =============================================================================
// NEXT.JS MOCKS
// =============================================================================
// Mocks for Next.js components and utilities used across multiple test files

// Mock next/image globally for all tests
// Used in: 10+ component test files
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'next-image',
      'data-src': src,
      'data-alt': alt,
      ...props,
    }),
}))

// Mock next/link globally for all tests
// Used in: 5+ component test files with similar implementations
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) =>
    React.createElement('a', { href, ...props }, children),
}))

// =============================================================================
// DATABASE MOCKS
// =============================================================================
// Mocks for database-related modules to prevent actual database connections

// Mock environment configuration
// Used in: 1+ service test files
vi.mock('@/libs/Env', () => ({
  Env: {
    DATABASE_URL: 'test-database-url',
  },
}))

// Mock pg module to prevent database imports
vi.mock('pg', () => ({
  Client: vi.fn(),
  Pool: vi.fn(),
}))

// Mock drizzle-orm to prevent database imports
// Used in: All service test files
vi.mock('drizzle-orm', () => ({
  drizzle: vi.fn(),
  pgTable: vi.fn(),
  text: vi.fn(),
  integer: vi.fn(),
  timestamp: vi.fn(),
  boolean: vi.fn(),
  json: vi.fn(),
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  asc: vi.fn(),
  isNull: vi.fn(),
  ne: vi.fn(),
  exists: vi.fn(),
  pgEnum: vi.fn(),
  sql: vi.fn(),
  SQL: vi.fn(),
}))

// Mock drizzle-orm node-postgres adapter
// Used in: All service test files
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(),
  pgTable: vi.fn(),
  text: vi.fn(),
  integer: vi.fn(),
  timestamp: vi.fn(),
  boolean: vi.fn(),
  json: vi.fn(),
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  isNull: vi.fn(),
  ne: vi.fn(),
  pgEnum: vi.fn(),
  sql: vi.fn(),
  NodePgDatabase: vi.fn(),
}))

// Mock the application database module
// Used in: All service test files
vi.mock('@/libs/DB', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    transaction: vi.fn(),
    execute: vi.fn(),
  },
}))

// =============================================================================
// BROWSER API MOCKS
// =============================================================================
// Mocks for browser APIs not available in test environment

// Mock IntersectionObserver
// Used in: Component tests that use intersection-based features
globalThis.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn((_element) => {
    // Immediately trigger the callback to simulate element being in viewport
    setTimeout(() => {
      callback([{ isIntersecting: true }])
    }, 0)
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Clear all mocks and timers before each test
beforeEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// Cleanup after each test (only in browser environment)
afterEach(() => {
  if (typeof window !== 'undefined') {
    cleanup()
  }
})
