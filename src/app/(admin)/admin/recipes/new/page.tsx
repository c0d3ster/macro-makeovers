import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { Button } from '@/components/atoms'
import { RecipeForm } from '@/components/organisms'
import { CleanPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'

export const metadata: Metadata = {
  title: `New recipe - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

const NewRecipePage = (): ReactElement => (
  <CleanPageTemplate
      activeItem='manage'
    title='New recipe'
    subtitle='Saves as a draft. Publish it from the recipe list.'
    header={
      <Button href='/admin' variant='outline' size='sm'>
        Back to recipes
      </Button>
    }
  >
    <RecipeForm />
  </CleanPageTemplate>
)

export default NewRecipePage
