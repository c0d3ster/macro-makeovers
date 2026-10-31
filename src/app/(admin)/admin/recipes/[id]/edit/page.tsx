import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { notFound } from 'next/navigation'

import { RecipeForm } from '@/components/organisms'
import { CleanPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import { getRecipeForEdit } from '@/libs/recipes'
import { createAdminClient } from '@/libs/supabase/admin'

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
  const recipe = await getRecipeForEdit(createAdminClient(), id).catch(
    (error) => {
      // A malformed id or a missing recipe both end at the 404 page
      logger.error('Could not load the recipe to edit', { id, error })
      return undefined
    }
  )
  if (!recipe) notFound()

  return (
    <CleanPageTemplate
      title={recipe.title}
      subtitle='Every save keeps a revision, and published recipes update right away.'
    >
      <RecipeForm recipeId={id} initial={recipe} action={saveRecipeAction} />
    </CleanPageTemplate>
  )
}

export default EditRecipePage
