'use client'

import type { ReactNode } from 'react'

import { ApolloProvider } from '@apollo/client/react'
import { useState } from 'react'

import { ToastContainer } from '@/components/atoms'
import { createApolloClient } from '@/libs/ApolloClient'
import { AuthProvider, QueryProvider } from '@/providers'

type ProvidersWrapperProps = {
  children: ReactNode
}

export const ProvidersWrapper = ({ children }: ProvidersWrapperProps) => {
  // Create Apollo client once per browser session (client-side singleton)
  const [apolloClient] = useState(() => createApolloClient())

  return (
    <AuthProvider>
      <ApolloProvider client={apolloClient}>
        <QueryProvider>
          {children}
          <ToastContainer />
        </QueryProvider>
      </ApolloProvider>
    </AuthProvider>
  )
}
