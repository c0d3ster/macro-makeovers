import gql from 'graphql-tag'

import type {
  SubmitContactFormMutation,
  SubmitContactFormMutationVariables,
} from '@/graphql/generated/graphql'

import { useSubmitContactFormMutation } from '@/graphql/generated/graphql'
import { getApolloClient } from '@/libs/ApolloClient'

// GraphQL Operations
export const SUBMIT_CONTACT_FORM = gql`
  mutation SubmitContactForm($input: ContactFormInput!) {
    submitContactForm(input: $input) {
      id
      name
      email
      subject
      message
      submittedAt
    }
  }
`

// Hooks for components
export const useSubmitContactForm = () => useSubmitContactFormMutation()

// Async functions for SSR / non-hook usage
export const submitContactForm = async (
  input: SubmitContactFormMutationVariables['input']
) => {
  const client = getApolloClient()
  const result = await client.mutate<
    SubmitContactFormMutation,
    SubmitContactFormMutationVariables
  >({
    mutation: SUBMIT_CONTACT_FORM,
    variables: { input },
  })
  if (!result.data)
    throw new Error('No data returned from SubmitContactForm mutation')
  return result.data.submitContactForm
}
