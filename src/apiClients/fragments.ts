import { gql } from 'graphql-tag'

// User display fragment - contains core user information for display purposes
export const USER_DISPLAY_FRAGMENT = gql`
  fragment UserDisplay on User {
    id
    firstName
    lastName
    email
  }
`
