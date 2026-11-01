import { describe, expect, it, vi } from 'vitest'

import type { GraphQLContext } from '@/graphql/context'
import type { RecipeService } from '@/services'

import { ImportRecipeStatus } from '@/graphql/schema'

import { RecipeResolver } from './RecipeResolver'

const created = {
  status: ImportRecipeStatus.Created,
  slug: 'blackened-chicken-alfredo',
  issues: [],
  changes: [],
}

const setup = ({ isOwner, authId }: { isOwner: boolean; authId?: string }) => {
  const importRecipe = vi.fn().mockResolvedValue(created)
  const resolver = new RecipeResolver({ importRecipe } as unknown as RecipeService)
  const ctx = {
    authId,
    isOwner: vi.fn().mockResolvedValue(isOwner),
  } as unknown as GraphQLContext
  return { importRecipe, resolver, ctx }
}

// Drizzle writes over a connection that bypasses RLS, so this gate is the access control
describe('RecipeResolver.importRecipe', () => {
  it('refuses anyone who is not the owner and writes nothing', async () => {
    const { importRecipe, resolver, ctx } = setup({ isOwner: false })

    await expect(
      resolver.importRecipe({ slug: 'x' }, false, false, undefined, ctx)
    ).rejects.toMatchObject({
      message: 'Only the site owner can import recipes.',
      extensions: { code: 'FORBIDDEN' },
    })
    expect(importRecipe).not.toHaveBeenCalled()
  })

  it('passes the recipe, options, and the importer to the service', async () => {
    const { importRecipe, resolver, ctx } = setup({
      isOwner: true,
      authId: 'auth-1',
    })
    const recipe = { slug: 'blackened-chicken-alfredo' }

    await expect(resolver.importRecipe(recipe, true, false, 'recipe-1', ctx)).resolves.toBe(
      created
    )
    expect(importRecipe).toHaveBeenCalledWith(recipe, {
      overwrite: true,
      dryRun: false,
      authId: 'auth-1',
      recipeId: 'recipe-1',
    })
  })
})
