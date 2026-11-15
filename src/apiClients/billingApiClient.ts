import gql from 'graphql-tag'

import {
  useBookDownloadUrlMutation,
  useOpenBillingPortalMutation,
  useStartCheckoutMutation,
} from '@/graphql/generated/graphql'

// GraphQL Operations
export const GET_MY_PLAN = gql`
  query GetMyPlan {
    myPlan {
      hasPaidAccess
      source
      status
      currentPeriodEnd
      cancelAtPeriodEnd
      canSubscribe
      canManageBilling
    }
  }
`

export const START_CHECKOUT = gql`
  mutation StartCheckout {
    startCheckout
  }
`

export const OPEN_BILLING_PORTAL = gql`
  mutation OpenBillingPortal {
    openBillingPortal
  }
`

export const BOOK_DOWNLOAD_URL = gql`
  mutation BookDownloadUrl {
    bookDownloadUrl
  }
`

// Each returns a function that resolves to the URL to send the browser to. Errors (including
// SUBSCRIPTION_REQUIRED) are thrown for the caller to show.
export const useStartCheckout = (): (() => Promise<string>) => {
  const [startCheckout] = useStartCheckoutMutation()
  return async () => {
    const { data } = await startCheckout()
    if (!data?.startCheckout) throw new Error('Could not start checkout.')
    return data.startCheckout
  }
}

export const useOpenBillingPortal = (): (() => Promise<string>) => {
  const [openBillingPortal] = useOpenBillingPortalMutation()
  return async () => {
    const { data } = await openBillingPortal()
    if (!data?.openBillingPortal) throw new Error('Could not open billing.')
    return data.openBillingPortal
  }
}

export const useBookDownloadUrl = (): (() => Promise<string>) => {
  const [bookDownloadUrl] = useBookDownloadUrlMutation()
  return async () => {
    const { data } = await bookDownloadUrl()
    if (!data?.bookDownloadUrl) throw new Error('Could not get the book.')
    return data.bookDownloadUrl
  }
}
