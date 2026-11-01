import { GraphQLError } from 'graphql'
import { Arg, Ctx, ID, Mutation, Query, Resolver } from 'type-graphql'

import type { GraphQLContext } from '@/graphql/context'
import type { RecipeService } from '@/services'

import {
  AdminRecipe,
  EditableRecipe,
  ImportRecipeResult,
  JsonScalar,
  PublishStatus,
  RecipeCard,
  RecipeDetail,
} from '@/graphql/schema'
import { logger } from '@/libs/Logger'

// Recipe writes and draft reads go through the database owner's connection, which bypasses
// RLS, so each one starts here
const requireOwner = async (
  ctx: GraphQLContext,
  action: string
): Promise<void> => {
  if (await ctx.isOwner()) return

  throw new GraphQLError(`Only the site owner can ${action}.`, {
    extensions: { code: 'FORBIDDEN' },
  })
}

// The list and the status change both show a recipe the same way
const toAdminRecipe = ({
  updatedAt,
  ...recipe
}: Awaited<
  ReturnType<RecipeService['getAdminRecipes']>
>[number]): AdminRecipe => ({
  ...recipe,
  updatedAt: updatedAt.toISOString(),
})

@Resolver()
export class RecipeResolver {
  constructor(private recipeService: RecipeService) {}

  @Query(() => [RecipeCard], {
    description: 'Published base recipes for the grid, A to Z',
  })
  recipeCards(): Promise<RecipeCard[]> {
    return this.recipeService.getRecipeCards()
  }

  @Query(() => RecipeDetail, {
    nullable: true,
    description:
      'One published recipe, or null for an unknown or unpublished slug',
  })
  async recipe(
    @Arg('slug', () => String) slug: string
  ): Promise<RecipeDetail | null> {
    return (await this.recipeService.getRecipe(slug)) ?? null
  }

  @Query(() => [String], { description: 'Every published slug' })
  recipeSlugs(): Promise<string[]> {
    return this.recipeService.getRecipeSlugs()
  }

  @Query(() => [String], {
    description:
      'Slugs of published recipes with an ingredient matching the search',
  })
  recipeSlugsByIngredient(
    @Arg('search', () => String) search: string
  ): Promise<string[]> {
    return this.recipeService.getRecipeSlugsByIngredient(search)
  }

  @Query(() => [AdminRecipe], {
    description: 'Drafts and published recipes, newest edit first. Owner only.',
  })
  async adminRecipes(@Ctx() ctx: GraphQLContext): Promise<AdminRecipe[]> {
    await requireOwner(ctx, 'list every recipe')

    const recipes = await this.recipeService.getAdminRecipes()
    return recipes.map(toAdminRecipe)
  }

  @Query(() => EditableRecipe, {
    nullable: true,
    description: 'A stored recipe in import shape for the editor. Owner only.',
  })
  async editableRecipe(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<EditableRecipe | null> {
    await requireOwner(ctx, 'edit recipes')

    return (await this.recipeService.getEditableRecipe(id)) ?? null
  }

  @Mutation(() => AdminRecipe, {
    description: 'Publishes or unpublishes a recipe. Owner only.',
  })
  async setRecipeStatus(
    @Arg('id', () => ID) id: string,
    @Arg('status', () => PublishStatus) status: PublishStatus,
    @Ctx() ctx: GraphQLContext
  ): Promise<AdminRecipe> {
    await requireOwner(ctx, 'publish recipes')

    const recipe = await this.recipeService.setRecipeStatus(
      id,
      status === PublishStatus.Published ? 'published' : 'draft'
    )
    if (!recipe) {
      throw new GraphQLError('That recipe does not exist.', {
        extensions: { code: 'NOT_FOUND' },
      })
    }
    return toAdminRecipe(recipe)
  }

  @Mutation(() => ImportRecipeResult, {
    description:
      'Validates a recipe and saves it as a draft. An existing slug is only replaced with overwrite. dryRun checks and diffs without writing. Owner only.',
  })
  async importRecipe(
    @Arg('recipe', () => JsonScalar) recipe: unknown,
    @Arg('overwrite', () => Boolean, { defaultValue: false })
    overwrite: boolean,
    @Arg('dryRun', () => Boolean, { defaultValue: false }) dryRun: boolean,
    @Arg('recipeId', () => ID, {
      nullable: true,
      description:
        'The recipe being edited. When set, the slug has to belong to it.',
    })
    recipeId: string | undefined,
    @Ctx() ctx: GraphQLContext
  ): Promise<ImportRecipeResult> {
    await requireOwner(ctx, 'import recipes')

    try {
      return await this.recipeService.importRecipe(recipe, {
        overwrite,
        dryRun,
        authId: ctx.authId,
        recipeId,
      })
    } catch (error) {
      logger.error('Error in importRecipe mutation', { error: String(error) })
      throw error
    }
  }
}
