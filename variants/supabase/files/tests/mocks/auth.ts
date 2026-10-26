import { vi } from 'vitest'

/**
 * Authentication-related mocks
 * Used in 3+ component test files
 */

export const createMockAuth = (overrides = {}) => ({
  user: null,
  isLoaded: true,
  signOut: vi.fn(),
  ...overrides,
})

export const createMockSupabaseServer = () => ({
  auth: {
    getClaims: vi.fn().mockResolvedValue({ data: null, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
})

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'client',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})
