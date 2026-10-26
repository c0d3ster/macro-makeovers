import gql from 'graphql-tag'

import type {
  GetMeQuery,
  GetUserQuery,
  GetUserQueryVariables,
  UpdateUserMutation,
  UpdateUserMutationVariables,
} from '@/graphql/generated/graphql'

import {
  useGetMeQuery,
  useGetUserQuery,
  useUpdateUserMutation,
} from '@/graphql/generated/graphql'
import { getApolloClient } from '@/libs/ApolloClient'

// GraphQL Operations
export const GET_ME = gql`
  query GetMe {
    me {
      id
      clerkId
      email
      firstName
      lastName
      role
      avatarUrl
      createdAt
      updatedAt
    }
  }
`

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      clerkId
      email
      firstName
      lastName
      role
      avatarUrl
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      firstName
      lastName
      avatarUrl
      updatedAt
    }
  }
`

// Hooks for components
export const useGetMe = () => useGetMeQuery()
export const useGetUser = (id: string) => useGetUserQuery({ variables: { id } })

export const useUpdateUser = () => useUpdateUserMutation()

// Async functions for SSR / non-hook usage
export const getMe = async () => {
  const client = getApolloClient()
  const result = await client.query<GetMeQuery>({
    query: GET_ME,
  })
  if (!result.data) throw new Error('No data returned from GetMe query')
  if (!result.data.me) throw new Error('User not found')
  return result.data.me
}

export const getUser = async (id: string) => {
  const client = getApolloClient()
  const result = await client.query<GetUserQuery, GetUserQueryVariables>({
    query: GET_USER,
    variables: { id },
  })
  if (!result.data) throw new Error('No data returned from GetUser query')
  if (!result.data.user) throw new Error(`User with id ${id} not found`)
  return result.data.user
}

export const updateUser = async (
  id: string,
  input: UpdateUserMutationVariables['input']
) => {
  const client = getApolloClient()
  const result = await client.mutate<
    UpdateUserMutation,
    UpdateUserMutationVariables
  >({
    mutation: UPDATE_USER,
    variables: { id, input },
  })
  if (!result.data) throw new Error('No data returned from UpdateUser mutation')
  if (!result.data.updateUser)
    throw new Error(`Failed to update user with id ${id}`)
  return result.data.updateUser
}
