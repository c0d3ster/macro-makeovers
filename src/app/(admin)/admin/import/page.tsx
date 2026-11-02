import type { Metadata } from 'next'

import { Button } from '@/components/atoms'
import { RecipeImportForm } from '@/components/organisms'
import { CleanPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'

export const metadata: Metadata = {
  title: `Import a recipe - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

const ImportPage = () => (
  <CleanPageTemplate
      activeItem='manage'
    title='Import a recipe'
    subtitle='Paste the JSON your agent produced. New recipes land as drafts.'
    header={
      <Button href='/admin' variant='outline' size='sm'>
        Back to recipes
      </Button>
    }
  >
    <RecipeImportForm />
  </CleanPageTemplate>
)

export default ImportPage
