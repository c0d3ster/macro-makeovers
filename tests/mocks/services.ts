import { vi } from 'vitest'

/**
 * Service mocks for resolver tests
 * Provides comprehensive mocks for all services used by GraphQL resolvers
 */

// Mock UserService
export const createMockUserService = () => ({
  getCurrentUserWithAuth: vi.fn(),
  getUserById: vi.fn(),
  getUserByEmail: vi.fn(),
  getUsers: vi.fn(),
  updateUser: vi.fn(),
  checkPermission: vi.fn(),
})

// Mock ContactService
export const createMockContactService = () => ({
  submitContactForm: vi.fn(),
})
