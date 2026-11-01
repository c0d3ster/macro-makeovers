import { GraphQLError } from 'graphql'
import { Arg, Ctx, Mutation, Resolver } from 'type-graphql'

import type { GraphQLContext } from '@/graphql/context'
import type { RecipeService } from '@/services'

import { ImportRecipeResult, JsonScalar } from '@/graphql/schema'
import { logger } from '@/libs/Logger'

@Resolver()
export class RecipeResolver {
  constructor(private recipeService: RecipeService) {}

  @Mutation(() => ImportRecipeResult, {
    description:
      'Validates a recipe and saves it as a draft. An existing slug is only replaced with overwrite. dryRun checks and diffs without writing. Owner only.',
  })
  async importRecipe(
    @Arg('recipe', () => JsonScalar) recipe: unknown,
    @Arg('overwrite', () => Boolean, { defaultValue: false })
    overwrite: boolean,
    @Arg('dryRun', () => Boolean, { defaultValue: false }) dryRun: boolean,
    @Ctx() ctx: GraphQLContext
  ): Promise<ImportRecipeResult> {
    if (!(await ctx.isOwner())) {
      throw new GraphQLError('Only the site owner can import recipes.', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    try {
      return await this.recipeService.importRecipe(recipe, {
        overwrite,
        dryRun,
      })
    } catch (error) {
      logger.error('Error in importRecipe mutation', { error: String(error) })
      throw error
    }
  }
}
