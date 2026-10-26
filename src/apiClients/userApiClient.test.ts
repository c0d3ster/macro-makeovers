import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  GET_ME,
  GET_USER,
  getMe,
  getUser,
  UPDATE_USER,
  updateUser,
  useGetMe,
  useGetUser,
  useUpdateUser,
} from './userApiClient'

// Mock Apollo Client
const mockQuery = vi.fn()
const mockMutate = vi.fn()
vi.mock('@/libs/ApolloClient', () => ({
  getApolloClient: vi.fn(() => ({
    query: mockQuery,
    mutate: mockMutate,
  })),
}))

// Mock the generated GraphQL hooks
vi.mock('@/graphql/generated/graphql', () => ({
  useGetMeQuery: vi.fn(),
  useGetUserQuery: vi.fn(),
  useUpdateUserMutation: vi.fn(),
}))

describe('User API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GraphQL Operations', () => {
    it('should define all GraphQL operations', () => {
      expect(GET_ME).toBeDefined()
      expect(GET_USER).toBeDefined()
      expect(UPDATE_USER).toBeDefined()

      expect(GET_ME.definitions).toHaveLength(1)
      expect(GET_USER.definitions).toHaveLength(1)
      expect(UPDATE_USER.definitions).toHaveLength(1)
    })
  })

  describe('Hooks', () => {
    it('should export all required hooks', () => {
      expect(useGetMe).toBeDefined()
      expect(useGetUser).toBeDefined()
      expect(useUpdateUser).toBeDefined()

      expect(typeof useGetMe).toBe('function')
      expect(typeof useGetUser).toBe('function')
      expect(typeof useUpdateUser).toBe('function')
    })
  })

  describe('Async Functions', () => {
    describe('getMe', () => {
      it('should successfully get current user', async () => {
        const mockUser = {
          id: '1',
          clerkId: 'clerk-123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'DEVELOPER',
          avatarUrl: 'https://avatar.com/image.jpg',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }

        const mockResponse = {
          data: {
            me: mockUser,
          },
        }

        mockQuery.mockResolvedValue(mockResponse)

        const result = await getMe()

        expect(mockQuery).toHaveBeenCalledWith({
          query: GET_ME,
        })
        expect(result).toEqual(mockUser)
      })

      it('should throw error when no data is returned', async () => {
        mockQuery.mockResolvedValue({ data: null })

        await expect(getMe()).rejects.toThrow(
          'No data returned from GetMe query'
        )
      })

      it('should throw error when apollo client throws', async () => {
        const error = new Error('Network error')
        mockQuery.mockRejectedValue(error)

        await expect(getMe()).rejects.toThrow('Network error')
      })
    })

    describe('getUser', () => {
      it('should successfully get user by id', async () => {
        const mockUserId = 'user-1'
        const mockUser = {
          id: 'user-1',
          clerkId: 'clerk-123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'DEVELOPER',
          avatarUrl: 'https://avatar.com/image.jpg',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }

        const mockResponse = {
          data: {
            user: mockUser,
          },
        }

        mockQuery.mockResolvedValue(mockResponse)

        const result = await getUser(mockUserId)

        expect(mockQuery).toHaveBeenCalledWith({
          query: GET_USER,
          variables: { id: mockUserId },
        })
        expect(result).toEqual(mockUser)
      })

      it('should throw error when no data is returned', async () => {
        const mockUserId = 'user-1'

        mockQuery.mockResolvedValue({ data: null })

        await expect(getUser(mockUserId)).rejects.toThrow(
          'No data returned from GetUser query'
        )
      })

      it('should throw error when apollo client throws', async () => {
        const mockUserId = 'user-1'
        const error = new Error('Network error')

        mockQuery.mockRejectedValue(error)

        await expect(getUser(mockUserId)).rejects.toThrow('Network error')
      })
    })

    describe('updateUser', () => {
      it('should successfully update user', async () => {
        const mockUserId = 'user-1'
        const mockInput = {
          firstName: 'Jane',
          lastName: 'Smith',
          avatarUrl: 'https://avatar.com/new-image.jpg',
        }

        const mockUpdatedUser = {
          id: 'user-1',
          firstName: 'Jane',
          lastName: 'Smith',
          avatarUrl: 'https://avatar.com/new-image.jpg',
          updatedAt: '2024-01-02T00:00:00Z',
        }

        const mockResponse = {
          data: {
            updateUser: mockUpdatedUser,
          },
        }

        mockMutate.mockResolvedValue(mockResponse)

        const result = await updateUser(mockUserId, mockInput)

        expect(mockMutate).toHaveBeenCalledWith({
          mutation: UPDATE_USER,
          variables: { id: mockUserId, input: mockInput },
        })
        expect(result).toEqual(mockUpdatedUser)
      })

      it('should throw error when no data is returned', async () => {
        const mockUserId = 'user-1'
        const mockInput = {
          firstName: 'Jane',
          lastName: 'Smith',
        }

        mockMutate.mockResolvedValue({ data: null })

        await expect(updateUser(mockUserId, mockInput)).rejects.toThrow(
          'No data returned from UpdateUser mutation'
        )
      })

      it('should throw error when apollo client throws', async () => {
        const mockUserId = 'user-1'
        const mockInput = {
          firstName: 'Jane',
          lastName: 'Smith',
        }
        const error = new Error('Network error')

        mockMutate.mockRejectedValue(error)

        await expect(updateUser(mockUserId, mockInput)).rejects.toThrow(
          'Network error'
        )
      })
    })
  })
})
