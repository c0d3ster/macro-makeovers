'use client'

import type { ReactNode } from 'react'

import { ApolloProvider } from '@apollo/client/react' // @module:graphql
import { useState } from 'react' // @module:graphql

import { ToastContainer } from '@/components/atoms'
import { createApolloClient } from '@/libs/ApolloClient' // @module:graphql
import {
  ClerkProvider, // @module:auth
  QueryProvider,
} from '@/providers'

type ProvidersWrapperProps = {
  children: ReactNode
}

export const ProvidersWrapper = ({ children }: ProvidersWrapperProps) => {
  // #region @module:graphql
  // Create Apollo client once per browser session (client-side singleton)
  const [apolloClient] = useState(() => createApolloClient())
  // #endregion @module:graphql

  return (
    // #region @module:auth
    <ClerkProvider>
      {/* #endregion @module:auth */}
      {/* #region @module:graphql */}
      <ApolloProvider client={apolloClient}>
        {/* #endregion @module:graphql */}
        <QueryProvider>
          {children}
          <ToastContainer />
        </QueryProvider>
        {/* #region @module:graphql */}
      </ApolloProvider>
      {/* #endregion @module:graphql */}
      {/* #region @module:auth */}
    </ClerkProvider>
    // #endregion @module:auth
  )
}
