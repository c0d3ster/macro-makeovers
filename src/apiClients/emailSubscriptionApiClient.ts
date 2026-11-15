import gql from 'graphql-tag'

import type {
  ConfirmEmailSubscriptionMutation,
  ConfirmEmailSubscriptionMutationVariables,
  SubscribeToEmailsMutation,
  SubscribeToEmailsMutationVariables,
  UnsubscribeFromEmailsMutation,
  UnsubscribeFromEmailsMutationVariables,
} from '@/graphql/generated/graphql'

import {
  useConfirmEmailSubscriptionMutation,
  useSubscribeToEmailsMutation,
  useUnsubscribeFromEmailsMutation,
} from '@/graphql/generated/graphql'
import { getApolloClient } from '@/libs/ApolloClient'

// GraphQL Operations
export const SUBSCRIBE_TO_EMAILS = gql`
  mutation SubscribeToEmails($input: EmailSubscribeInput!) {
    subscribeToEmails(input: $input)
  }
`

export const CONFIRM_EMAIL_SUBSCRIPTION = gql`
  mutation ConfirmEmailSubscription($token: String!) {
    confirmEmailSubscription(token: $token)
  }
`

export const UNSUBSCRIBE_FROM_EMAILS = gql`
  mutation UnsubscribeFromEmails($token: String!) {
    unsubscribeFromEmails(token: $token)
  }
`

// Hooks for components
export const useSubscribeToEmails = () => useSubscribeToEmailsMutation()
export const useConfirmEmailSubscription = () =>
  useConfirmEmailSubscriptionMutation()
export const useUnsubscribeFromEmails = () => useUnsubscribeFromEmailsMutation()

// Async functions for non-hook usage
export const subscribeToEmails = async (
  input: SubscribeToEmailsMutationVariables['input']
): Promise<boolean> => {
  const result = await getApolloClient().mutate<
    SubscribeToEmailsMutation,
    SubscribeToEmailsMutationVariables
  >({
    mutation: SUBSCRIBE_TO_EMAILS,
    variables: { input },
  })
  if (!result.data)
    throw new Error('No data returned from SubscribeToEmails mutation')
  return result.data.subscribeToEmails
}

export const confirmEmailSubscription = async (
  token: string
): Promise<boolean> => {
  const result = await getApolloClient().mutate<
    ConfirmEmailSubscriptionMutation,
    ConfirmEmailSubscriptionMutationVariables
  >({
    mutation: CONFIRM_EMAIL_SUBSCRIPTION,
    variables: { token },
  })
  if (!result.data)
    throw new Error('No data returned from ConfirmEmailSubscription mutation')
  return result.data.confirmEmailSubscription
}

export const unsubscribeFromEmails = async (token: string): Promise<boolean> => {
  const result = await getApolloClient().mutate<
    UnsubscribeFromEmailsMutation,
    UnsubscribeFromEmailsMutationVariables
  >({
    mutation: UNSUBSCRIBE_FROM_EMAILS,
    variables: { token },
  })
  if (!result.data)
    throw new Error('No data returned from UnsubscribeFromEmails mutation')
  return result.data.unsubscribeFromEmails
}
