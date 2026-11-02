import { GraphQLError } from 'graphql'
import { Arg, Ctx, ID, Mutation, Resolver } from 'type-graphql'

import type { GraphQLContext } from '@/graphql/context'
import type { RecipeService } from '@/services'

import {
  AdminRecipe,
  ImportRecipeResult,
  JsonScalar,
  PublishStatus,
} from '@/graphql/schema'
import { logger } from '@/libs/Logger'

// Recipe writes go through the database owner's connection, which bypasses RLS, so each one
// starts here
const requireOwner = async (
  ctx: GraphQLContext,
  action: string
): Promise<void> => {
  if (await ctx.isOwner()) return

  throw new GraphQLError(`Only the site owner can ${action}.`, {
    extensions: { code: 'FORBIDDEN' },
  })
}

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

  @Mutation(() => ID, {
    description:
      'Deletes a recipe with its revision history. Refused while other recipes are variants of it. Owner only.',
  })
  async deleteRecipe(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<string> {
    await requireOwner(ctx, 'delete recipes')

    const result = await this.recipeService.deleteRecipe(id)
    if (result.status === 'not_found') {
      throw new GraphQLError('That recipe does not exist.', {
        extensions: { code: 'NOT_FOUND' },
      })
    }
    if (result.status === 'has_variants') {
      throw new GraphQLError(
        `Delete or unlink its variants first: ${result.titles.join(', ')}.`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      )
    }
    return id
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
