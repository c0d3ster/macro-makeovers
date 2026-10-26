import { vi } from 'vitest'

/**
 * Service mocks for resolver tests
 * Provides comprehensive mocks for all services used by GraphQL resolvers
 */

// #region @module:auth
// Mock UserService
export const createMockUserService = () => ({
  getCurrentUserWithAuth: vi.fn(),
  getUserById: vi.fn(),
  getUserByEmail: vi.fn(),
  getUsers: vi.fn(),
  updateUser: vi.fn(),
  checkPermission: vi.fn(),
})
// #endregion @module:auth

// #region @module:email
// Mock ContactService
export const createMockContactService = () => ({
  submitContactForm: vi.fn(),
})
// #endregion @module:email
