import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

import { getBaseUrl } from '@/utils/Env'

// Determine the GraphQL endpoint URL
const getGraphQLEndpoint = () => {
  if (typeof window === 'undefined') {
    return `${getBaseUrl()}/api/graphql`
  }
  return '/api/graphql'
}

// Create HTTP link
const createHttpLink = () =>
  new HttpLink({
    uri: getGraphQLEndpoint(),
    credentials: 'include', // send cookies if you need auth
  })

// Attach cookies for SSR requests
const authLink = setContext(async (_, { headers }) => {
  if (typeof window === 'undefined') {
    const { headers: nextHeaders } = await import('next/headers')
    const cookie = (await nextHeaders()).get('cookie') ?? ''
    return { headers: { ...headers, cookie } }
  }
  return { headers }
})

// Create a new Apollo Client instance
// Each call creates a fresh instance to prevent cache pollution between requests
export const createApolloClient = () =>
  new ApolloClient({
     
    link: authLink.concat(createHttpLink()),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
      query: {
        fetchPolicy: 'network-only',
      },
    },
  })

/**
 * Get Apollo Client instance for use in Server Components or API routes
 * Always creates a new instance on the server to prevent cache pollution
 * @returns A fresh Apollo Client instance
 */
export const getApolloClient = () => {
  return createApolloClient()
}
