import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { NextRequest } from 'next/server'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { graphql } from 'graphql'
import { z } from 'zod'

import { createSchema } from '@/graphql'
import { createTokenContext } from '@/graphql/context'
import { basketItemSchema, recipeImportSchema } from '@/validations'

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
      basketPrices { build perServing tier statedTier }
      warnings { path message }
    }
  }
`

const BASKET_ITEMS = `
  query BasketItems {
    basketItems
  }
`

const SAVE_BASKET_ITEMS = `
  mutation SaveBasketItems($items: JSON!, $dryRun: Boolean!) {
    saveBasketItems(items: $items, dryRun: $dryRun) {
      status
      keys
      issues { path message }
      costChanges { slug build before after }
    }
  }
`

const GET_RECIPE = `
  query RecipeForImport($slug: String!) {
    recipeForImport(slug: $slug) {
      id
      slug
      status
      updatedAt
      recipe
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

// Reads a saved recipe through the same GraphQL schema, so the owner check is the one the
// admin uses
const runGetRecipe = async (
  caller: McpCaller,
  slug: string
): Promise<CallToolResult> => {
  const { data, errors } = await graphql({
    schema: await createSchema(),
    source: GET_RECIPE,
    variableValues: { slug },
    contextValue: createTokenContext(caller.req, caller),
  })

  if (errors?.length) {
    return reply(errors.map(({ message }) => message).join('\n'), true)
  }
  const found = data?.recipeForImport
  if (!found) return reply(`No recipe has the slug "${slug}".`, true)

  return reply(JSON.stringify(found, null, 2))
}

// Runs a query or mutation through the same GraphQL schema the admin uses, so the owner check
// is the one there, and replies with the named field
const runOperation = async (
  caller: McpCaller,
  source: string,
  field: string,
  variableValues: Record<string, unknown> = {}
): Promise<CallToolResult> => {
  const { data, errors } = await graphql({
    schema: await createSchema(),
    source,
    variableValues,
    contextValue: createTokenContext(caller.req, caller),
  })

  if (errors?.length) {
    return reply(errors.map(({ message }) => message).join('\n'), true)
  }
  return reply(JSON.stringify(data?.[field] ?? null, null, 2))
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
      reply(JSON.stringify(z.toJSONSchema(recipeImportSchema, { io: 'input' })))
  )

  server.registerTool(
    'get_recipe',
    {
      description:
        'Returns a saved recipe by slug in import shape, drafts included, with its id, status, and updatedAt. Edit the recipe field and send it back through validate_recipe and import_recipe. The import replaces the whole recipe, so call get_recipe again right before importing and check updatedAt to make sure nobody saved it in between.',
      inputSchema: {
        slug: z
          .string()
          .describe('The recipe slug, like "turkey-taco-grillers"'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ slug }) => runGetRecipe(caller, slug)
  )

  server.registerTool(
    'validate_recipe',
    {
      description:
        'Checks a recipe against the import schema and compares it to the saved recipe with the same slug. Writes nothing. Status invalid lists the fields to fix, created means a new slug, updated lists what an overwrite would change, unchanged means it already matches. With basketLines, basketPrices gives each build\'s prorated cost per serving and $ tier, and warnings flag a costTier the prices disagree with.',
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
        "Saves a recipe. A new slug is created as a draft. An existing slug comes back as status conflict with the changes, and is only replaced when overwrite is true. An overwrite keeps the recipe's published status. Run validate_recipe first and show the person the result before saving.",
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

  server.registerTool(
    'list_basket_items',
    {
      description:
        "Returns the basket price book: every item a recipe's basketLines can name, with its key, pack, unit, price, sizes, price source, and date. Call it before writing basketLines, reuse an existing key when the product is the same, and write each line in that item's unit.",
      annotations: { readOnlyHint: true },
    },
    async () => runOperation(caller, BASKET_ITEMS, 'basketItems')
  )

  server.registerTool(
    'save_basket_items',
    {
      description:
        "Adds or replaces basket price items by key, sizes included. Use the lowest price found across stores and set isEstimate when it was looked up rather than seen on a shelf or receipt. The result lists every recipe and build whose cost per serving moves. Run it with dryRun true first and show the person the result. Items have to exist before a recipe's basketLines can name them.",
      inputSchema: {
        items: z
          .array(basketItemSchema)
          .min(1)
          .describe('The items to add or replace, whole: an item is replaced, not merged'),
        dryRun: z
          .boolean()
          .default(true)
          .describe('Check and list cost changes without writing'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async ({ items, dryRun }) =>
      runOperation(caller, SAVE_BASKET_ITEMS, 'saveBasketItems', { items, dryRun })
  )

  return server
}
