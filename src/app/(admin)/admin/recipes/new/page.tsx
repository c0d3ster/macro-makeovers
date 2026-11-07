import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { BackLink } from '@/components/atoms'
import { RecipeForm } from '@/components/organisms'
import { RecipeEditorTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'

export const metadata: Metadata = {
  title: `New recipe - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

const NewRecipePage = (): ReactElement => (
  <RecipeEditorTemplate
    title='New recipe'
    toolbarStart={
      <>
        <BackLink href='/admin'>Back to recipes</BackLink>
        <p>Saves as a draft. Publish it from the recipe list.</p>
      </>
    }
  >
    <RecipeForm />
  </RecipeEditorTemplate>
)

export default NewRecipePage
