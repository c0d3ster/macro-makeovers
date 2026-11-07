import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { notFound } from 'next/navigation'

import { BackLink } from '@/components/atoms'
import {
  RecipeDeleteButton,
  RecipePublishControls,
} from '@/components/molecules'
import { RecipeForm } from '@/components/organisms'
import { RecipeEditorTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

import { loadEditableRecipe } from '../../../loadAdminRecipes'

export const metadata: Metadata = {
  title: `Edit recipe - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

type EditRecipePageProps = {
  params: Promise<{ id: string }>
}

// The layout has already checked the owner, and the loader checks again
const EditRecipePage = async ({
  params,
}: EditRecipePageProps): Promise<ReactElement> => {
  const { id } = await params
  const editable = await loadEditableRecipe(id).catch((error) => {
    // A malformed id, a missing recipe, and a failed lookup all end at the 404 page
    logger.error('Could not load the recipe to edit', { id, error })
    return undefined
  })
  if (!editable) notFound()
  const { recipe, status, imageUrl } = editable

  return (
    <RecipeEditorTemplate
      title={`Edit ${recipe.title}`}
      toolbarStart={
        <>
          <BackLink href='/admin'>Back to recipes</BackLink>
          <p>
            Every save keeps a revision, and published recipes update right
            away.
          </p>
        </>
      }
      toolbarEnd={
        <RecipePublishControls id={id} slug={recipe.slug} status={status}>
          <RecipeDeleteButton
            id={id}
            title={recipe.title}
            redirectTo='/admin'
          />
        </RecipePublishControls>
      }
    >
      <RecipeForm recipeId={id} initial={recipe} imageUrl={imageUrl} />
    </RecipeEditorTemplate>
  )
}

export default EditRecipePage
