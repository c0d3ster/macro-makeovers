import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { notFound } from 'next/navigation'

import { Button } from '@/components/atoms'
import { RecipePublishControls } from '@/components/molecules'
import { RecipeForm } from '@/components/organisms'
import { CleanPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import { getRecipeForEdit, getRecipeStatus } from '@/libs/recipes'
import { createAdminClient } from '@/libs/supabase/admin'

import { setStatusAction } from '../../../actions'
import { saveRecipeAction } from '../../actions'

export const metadata: Metadata = {
  title: `Edit recipe - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

type EditRecipePageProps = {
  params: Promise<{ id: string }>
}

// The layout has already checked the owner, so the service role client is safe to use here
const EditRecipePage = async ({
  params,
}: EditRecipePageProps): Promise<ReactElement> => {
  const { id } = await params
  const client = createAdminClient()
  const [recipe, status] = await Promise.all([
    getRecipeForEdit(client, id),
    getRecipeStatus(client, id),
  ]).catch((error) => {
    // A malformed id or a missing recipe both end at the 404 page
    logger.error('Could not load the recipe to edit', { id, error })
    return []
  })
  if (!recipe || !status) notFound()

  return (
    <CleanPageTemplate
      title={recipe.title}
      subtitle='Every save keeps a revision, and published recipes update right away.'
      header={
        <div className='flex flex-col items-end gap-3'>
          <Button href='/admin' variant='outline' size='sm'>
            Back to recipes
          </Button>
          <RecipePublishControls
            id={id}
            slug={recipe.slug}
            status={status}
            action={setStatusAction}
          />
        </div>
      }
    >
      <RecipeForm recipeId={id} initial={recipe} action={saveRecipeAction} />
    </CleanPageTemplate>
  )
}

export default EditRecipePage
