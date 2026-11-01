import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { NextRequest } from 'next/server'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { graphql } from 'graphql'
import { z } from 'zod'

import { createSchema } from '@/graphql'
import { createTokenContext } from '@/graphql/context'
import { recipeImportSchema } from '@/validations'

type McpCaller = {
  req: NextRequest
  authId: string
  token: string
}

type ImportOptions = {
  overwrite: boolean
  dryRun: boolean
}

const IMPORT_RECIPE = `
  mutation ImportRecipe($recipe: JSON!, $overwrite: Boolean!, $dryRun: Boolean!) {
    importRecipe(recipe: $recipe, overwrite: $overwrite, dryRun: $dryRun) {
      status
      slug
      id
      issues { path message }
      changes { path before after }
    }
  }
`

const recipeArgument = z
  .record(z.string(), z.unknown())
  .describe(
    'The recipe in import shape. Call get_recipe_schema for the fields and rules.'
  )

const reply = (text: string, isError = false): CallToolResult => ({
  content: [{ type: 'text', text }],
  isError,
})

// Runs the same mutation the admin page uses, in-process, so GraphQL stays the one write path
const runImport = async (
  caller: McpCaller,
  recipe: Record<string, unknown>,
  options: ImportOptions
): Promise<CallToolResult> => {
  const { data, errors } = await graphql({
    schema: await createSchema(),
    source: IMPORT_RECIPE,
    variableValues: { recipe, ...options },
    contextValue: createTokenContext(caller.req, caller),
  })

  if (errors?.length) {
    return reply(errors.map(({ message }) => message).join('\n'), true)
  }

  return reply(JSON.stringify(data?.importRecipe ?? null, null, 2))
}

// A new server per request, because the transport is stateless
export const createRecipeMcpServer = (caller: McpCaller): McpServer => {
  const server = new McpServer({ name: 'macro-makeovers', version: '1.0.0' })

  server.registerTool(
    'get_recipe_schema',
    {
      description:
        'Returns the JSON Schema for a recipe in import shape. Call this before building a recipe so every field and rule is right.',
      annotations: { readOnlyHint: true },
    },
    async () =>
      reply(
        JSON.stringify(z.toJSONSchema(recipeImportSchema, { io: 'input' }))
      )
  )

  server.registerTool(
    'validate_recipe',
    {
      description:
        'Checks a recipe against the import schema and compares it to the saved recipe with the same slug. Writes nothing. Status invalid lists the fields to fix, created means a new slug, updated lists what an overwrite would change, unchanged means it already matches.',
      inputSchema: { recipe: recipeArgument },
      annotations: { readOnlyHint: true },
    },
    async ({ recipe }) =>
      runImport(caller, recipe, { overwrite: true, dryRun: true })
  )

  server.registerTool(
    'import_recipe',
    {
      description:
        'Saves a recipe. A new slug is created as a draft. An existing slug comes back as status conflict with the changes, and is only replaced when overwrite is true. An overwrite keeps the recipe\'s published status. Run validate_recipe first and show the person the result before saving.',
      inputSchema: {
        recipe: recipeArgument,
        overwrite: z
          .boolean()
          .default(false)
          .describe('Replace the saved recipe with the same slug'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async ({ recipe, overwrite }) =>
      runImport(caller, recipe, { overwrite, dryRun: false })
  )

  return server
}
