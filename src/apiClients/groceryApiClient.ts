import gql from 'graphql-tag'

import {
  useGroceryHandoffOptionsQuery,
  useGroceryStoresLazyQuery,
  useSendBasketToGrocerMutation,
} from '@/graphql/generated/graphql'

export const GROCERY_HANDOFF_OPTIONS = gql`
  query GroceryHandoffOptions {
    groceryHandoffOptions {
      enabled
      signedIn
      hasPaidAccess
      grocers {
        grocer
        connected
      }
      remembered {
        grocer
        storeId
        storeName
        zip
      }
      defaultGrocer
      disclosure
    }
  }
`

export const GROCERY_STORES = gql`
  query GroceryStores($zip: String!) {
    groceryStores(zip: $zip) {
      defaultGrocer
      krogerStores {
        id
        name
        address
      }
    }
  }
`

export const SEND_BASKET_TO_GROCER = gql`
  mutation SendBasketToGrocer($input: SendBasketInput!) {
    sendBasketToGrocer(input: $input) {
      grocer
      url
      matchedCount
      unmatched {
        key
        name
        display
      }
    }
  }
`

// Hooks for the basket's grocer picker
export const useGroceryHandoffOptions = () => useGroceryHandoffOptionsQuery()
export const useGroceryStores = () => useGroceryStoresLazyQuery()
export const useSendBasketToGrocer = () => useSendBasketToGrocerMutation()
