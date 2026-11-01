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

describe('RecipeResolver reads', () => {
  const read = (service: Record<string, unknown>, isOwner: boolean) => ({
    resolver: new RecipeResolver(service as unknown as RecipeService),
    ctx: {
      isOwner: vi.fn().mockResolvedValue(isOwner),
    } as unknown as GraphQLContext,
  })

  it('serves the public queries without asking who the caller is', async () => {
    const service = {
      getRecipeCards: vi.fn().mockResolvedValue([]),
      getRecipe: vi.fn().mockResolvedValue(undefined),
      getRecipeSlugs: vi.fn().mockResolvedValue(['a']),
      getRecipeSlugsByIngredient: vi.fn().mockResolvedValue(['b']),
    }
    const { resolver, ctx } = read(service, false)

    await expect(resolver.recipeCards()).resolves.toEqual([])
    await expect(resolver.recipe('missing')).resolves.toBeNull()
    await expect(resolver.recipeSlugs()).resolves.toEqual(['a'])
    await expect(resolver.recipeSlugsByIngredient('chicken')).resolves.toEqual([
      'b',
    ])
    expect(ctx.isOwner).not.toHaveBeenCalled()
  })

  it('refuses the draft queries for anyone but the owner and reads nothing', async () => {
    const service = {
      getAdminRecipes: vi.fn(),
      getEditableRecipe: vi.fn(),
    }
    const { resolver, ctx } = read(service, false)

    await expect(resolver.adminRecipes(ctx)).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    })
    await expect(resolver.editableRecipe('id-1', ctx)).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    })
    expect(service.getAdminRecipes).not.toHaveBeenCalled()
    expect(service.getEditableRecipe).not.toHaveBeenCalled()
  })

  it('gives the owner the admin list with ISO dates, and null for an unknown recipe', async () => {
    const service = {
      getAdminRecipes: vi.fn().mockResolvedValue([
        {
          id: 'r1',
          slug: 'chili',
          title: 'Chili',
          status: 'draft',
          updatedAt: new Date('2026-11-01T12:00:00.000Z'),
        },
      ]),
      getEditableRecipe: vi.fn().mockResolvedValue(undefined),
    }
    const { resolver, ctx } = read(service, true)

    await expect(resolver.adminRecipes(ctx)).resolves.toEqual([
      {
        id: 'r1',
        slug: 'chili',
        title: 'Chili',
        status: 'draft',
        updatedAt: '2026-11-01T12:00:00.000Z',
      },
    ])
    await expect(resolver.editableRecipe('r2', ctx)).resolves.toBeNull()
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
