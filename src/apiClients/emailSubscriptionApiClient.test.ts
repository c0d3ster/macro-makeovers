import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CONFIRM_EMAIL_SUBSCRIPTION,
  confirmEmailSubscription,
  SUBSCRIBE_TO_EMAILS,
  subscribeToEmails,
  UNSUBSCRIBE_FROM_EMAILS,
  unsubscribeFromEmails,
} from './emailSubscriptionApiClient'

const mockMutate = vi.fn()
vi.mock('@/libs/ApolloClient', () => ({
  getApolloClient: vi.fn(() => ({ mutate: mockMutate })),
}))

vi.mock('@/graphql/generated/graphql', () => ({
  useSubscribeToEmailsMutation: vi.fn(),
  useConfirmEmailSubscriptionMutation: vi.fn(),
  useUnsubscribeFromEmailsMutation: vi.fn(),
}))

describe('Email subscription API client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the sign-up with its traffic source', async () => {
    const input = {
      email: 'cook@example.com',
      path: '/recipes/tacos',
      source: 'reddit',
    }
    mockMutate.mockResolvedValue({ data: { subscribeToEmails: true } })

    await expect(subscribeToEmails(input)).resolves.toBe(true)
    expect(mockMutate).toHaveBeenCalledWith({
      mutation: SUBSCRIBE_TO_EMAILS,
      variables: { input },
    })
  })

  it('throws when the sign-up returns no data', async () => {
    mockMutate.mockResolvedValue({ data: null })

    await expect(subscribeToEmails({ email: 'cook@example.com' })).rejects.toThrow(
      'No data returned from SubscribeToEmails mutation'
    )
  })

  it('passes a server error through', async () => {
    mockMutate.mockRejectedValue(new Error('Enter a valid email address'))

    await expect(subscribeToEmails({ email: 'nope' })).rejects.toThrow(
      'Enter a valid email address'
    )
  })

  it('confirms with the token', async () => {
    mockMutate.mockResolvedValue({ data: { confirmEmailSubscription: true } })

    await expect(confirmEmailSubscription('token-123')).resolves.toBe(true)
    expect(mockMutate).toHaveBeenCalledWith({
      mutation: CONFIRM_EMAIL_SUBSCRIPTION,
      variables: { token: 'token-123' },
    })
  })

  it('unsubscribes with the token', async () => {
    mockMutate.mockResolvedValue({ data: { unsubscribeFromEmails: false } })

    await expect(unsubscribeFromEmails('token-123')).resolves.toBe(false)
    expect(mockMutate).toHaveBeenCalledWith({
      mutation: UNSUBSCRIBE_FROM_EMAILS,
      variables: { token: 'token-123' },
    })
  })
})
