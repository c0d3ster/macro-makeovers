import 'reflect-metadata'

import type { DocumentNode } from 'graphql'

import { graphql, print } from 'graphql'

import type { GraphQLContext } from './context'

import { createPublicContext, createSessionContext } from './context'
import { createSchema } from './index'

// Runs a query against the schema in this process, which is how server components use
// GraphQL: no HTTP round trip, and it works while the site is being built, when no server is
// listening yet. Throws when the query fails, so a page never renders from half a result.
const execute = async <Data>(
  document: DocumentNode,
  variables: Record<string, unknown>,
  contextValue: GraphQLContext
): Promise<Data> => {
  const { data, errors } = await graphql({
    schema: await createSchema(),
    source: print(document),
    variableValues: variables,
    contextValue,
  })

  if (errors?.length) {
    throw new Error(errors.map(({ message }) => message).join('\n'))
  }
  return data as Data
}

// For public pages: published recipes only, never reads cookies
export const runPublicQuery = <Data>(
  document: DocumentNode,
  variables: Record<string, unknown> = {}
): Promise<Data> => execute<Data>(document, variables, createPublicContext())

// For admin pages: runs as the signed-in visitor, and owner-only queries check who that is
export const runSessionQuery = async <Data>(
  document: DocumentNode,
  variables: Record<string, unknown> = {}
): Promise<Data> =>
  execute<Data>(document, variables, await createSessionContext())
