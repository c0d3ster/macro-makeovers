import { describe, expect, it, vi } from 'vitest'

import type { GraphQLContext } from '@/graphql/context'
import type { RecipeService } from '@/services'

import { ImportRecipeStatus, PublishStatus } from '@/graphql/schema'

import { RecipeResolver } from './RecipeResolver'

const created = {
  status: ImportRecipeStatus.Created,
  slug: 'blackened-chicken-alfredo',
  issues: [],
  changes: [],
}

const setup = ({ isOwner, authId }: { isOwner: boolean; authId?: string }) => {
  const importRecipe = vi.fn().mockResolvedValue(created)
  const resolver = new RecipeResolver({
    importRecipe,
  } as unknown as RecipeService)
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

    await expect(
      resolver.importRecipe(recipe, true, false, 'recipe-1', ctx)
    ).resolves.toBe(created)
    expect(importRecipe).toHaveBeenCalledWith(recipe, {
      overwrite: true,
      dryRun: false,
      authId: 'auth-1',
      recipeId: 'recipe-1',
    })
  })
})

describe('RecipeResolver.setRecipeStatus', () => {
  const recipe = {
    id: 'r1',
    slug: 'chili',
    title: 'Chili',
    status: 'published',
    updatedAt: new Date('2026-11-01T12:00:00.000Z'),
  }

  const setup = (isOwner: boolean, found = true) => {
    const setRecipeStatus = vi
      .fn()
      .mockResolvedValue(found ? recipe : undefined)
    return {
      setRecipeStatus,
      resolver: new RecipeResolver({
        setRecipeStatus,
      } as unknown as RecipeService),
      ctx: {
        isOwner: vi.fn().mockResolvedValue(isOwner),
      } as unknown as GraphQLContext,
    }
  }

  it('refuses anyone who is not the owner and changes nothing', async () => {
    const { resolver, ctx, setRecipeStatus } = setup(false)

    await expect(
      resolver.setRecipeStatus('r1', PublishStatus.Published, ctx)
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } })
    expect(setRecipeStatus).not.toHaveBeenCalled()
  })

  it('publishes for the owner and returns the recipe with an ISO date', async () => {
    const { resolver, ctx, setRecipeStatus } = setup(true)

    await expect(
      resolver.setRecipeStatus('r1', PublishStatus.Published, ctx)
    ).resolves.toMatchObject({
      slug: 'chili',
      updatedAt: '2026-11-01T12:00:00.000Z',
    })
    expect(setRecipeStatus).toHaveBeenCalledWith('r1', 'published')
  })

  it('maps draft through and reports an unknown recipe', async () => {
    const { resolver, ctx, setRecipeStatus } = setup(true, false)

    await expect(
      resolver.setRecipeStatus('r1', PublishStatus.Draft, ctx)
    ).rejects.toMatchObject({ extensions: { code: 'NOT_FOUND' } })
    expect(setRecipeStatus).toHaveBeenCalledWith('r1', 'draft')
  })
})

describe('RecipeResolver.deleteRecipe', () => {
  const setup = (
    isOwner: boolean,
    result: unknown = { status: 'deleted', slug: 'chili' }
  ) => {
    const deleteRecipe = vi.fn().mockResolvedValue(result)
    return {
      deleteRecipe,
      resolver: new RecipeResolver({
        deleteRecipe,
      } as unknown as RecipeService),
      ctx: {
        isOwner: vi.fn().mockResolvedValue(isOwner),
      } as unknown as GraphQLContext,
    }
  }

  it('refuses anyone who is not the owner and deletes nothing', async () => {
    const { resolver, ctx, deleteRecipe } = setup(false)

    await expect(resolver.deleteRecipe('r1', ctx)).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    })
    expect(deleteRecipe).not.toHaveBeenCalled()
  })

  it('returns the id of the recipe it deleted', async () => {
    const { resolver, ctx, deleteRecipe } = setup(true)

    await expect(resolver.deleteRecipe('r1', ctx)).resolves.toBe('r1')
    expect(deleteRecipe).toHaveBeenCalledWith('r1')
  })

  it('reports an unknown recipe', async () => {
    const { resolver, ctx } = setup(true, { status: 'not_found' })

    await expect(resolver.deleteRecipe('r1', ctx)).rejects.toMatchObject({
      extensions: { code: 'NOT_FOUND' },
    })
  })

  it('names the variants that block the delete', async () => {
    const { resolver, ctx } = setup(true, {
      status: 'has_variants',
      titles: ['Flank Steak Bulgogi', 'Pork Bulgogi'],
    })

    await expect(resolver.deleteRecipe('r1', ctx)).rejects.toMatchObject({
      message: expect.stringContaining('Flank Steak Bulgogi, Pork Bulgogi'),
      extensions: { code: 'BAD_USER_INPUT' },
    })
  })
})
