import type { Metadata } from 'next'

import { RecipeImportForm } from '@/components/organisms'
import { CleanPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'

import { importRecipeAction } from './actions'

export const metadata: Metadata = {
  title: `Import a recipe - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

const ImportPage = () => (
  <CleanPageTemplate
    title='Import a recipe'
    subtitle='Paste the JSON your agent produced. New recipes land as drafts.'
  >
    <RecipeImportForm action={importRecipeAction} />
  </CleanPageTemplate>
)

export default ImportPage
