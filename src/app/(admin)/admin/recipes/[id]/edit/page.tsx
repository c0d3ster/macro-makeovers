import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { notFound } from 'next/navigation'

import { Button } from '@/components/atoms'
import { RecipePublishControls } from '@/components/molecules'
import { RecipeForm } from '@/components/organisms'
import { CleanPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

import { loadEditableRecipe } from '../../../loadAdminRecipes'

export const metadata: Metadata = {
  title: `Edit recipe - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

type EditRecipePageProps = {
  params: Promise<{ id: string }>
}

// The layout has already checked the owner, and the query checks again
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
  const { recipe, status } = editable

  return (
    <CleanPageTemplate
      activeItem='manage'
      title={recipe.title}
      subtitle='Every save keeps a revision, and published recipes update right away.'
      header={
        <div className='flex flex-col items-end gap-3'>
          <Button href='/admin' variant='outline' size='sm'>
            Back to recipes
          </Button>
          <RecipePublishControls id={id} slug={recipe.slug} status={status} />
        </div>
      }
    >
      <RecipeForm recipeId={id} initial={recipe} />
    </CleanPageTemplate>
  )
}

export default EditRecipePage
