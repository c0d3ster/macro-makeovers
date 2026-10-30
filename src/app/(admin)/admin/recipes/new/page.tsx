import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { RecipeForm } from '@/components/organisms'
import { CleanPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'

import { saveRecipeAction } from '../actions'

export const metadata: Metadata = {
  title: `New recipe - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

const NewRecipePage = (): ReactElement => (
  <CleanPageTemplate
    title='New recipe'
    subtitle='Saves as a draft. Publish it from the recipe list.'
  >
    <RecipeForm action={saveRecipeAction} />
  </CleanPageTemplate>
)

export default NewRecipePage
