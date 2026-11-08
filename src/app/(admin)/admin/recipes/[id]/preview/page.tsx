import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { notFound, unstable_rethrow } from 'next/navigation'

import { Badge, Button } from '@/components/atoms'
import { RecipePageContent } from '@/components/organisms'
import { LandingPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

import { loadRecipePreview } from '../../../loadAdminRecipes'

export const metadata: Metadata = {
  title: `Preview - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
  robots: { index: false, follow: false },
}

type PreviewPageProps = {
  params: Promise<{ id: string }>
}

// The recipe page as visitors will see it, for any recipe including drafts. It shows what is
// saved, so unsaved edits in the editor do not appear until the editor saves.
const PreviewPage = async ({
  params,
}: PreviewPageProps): Promise<ReactElement> => {
  const { id } = await params
  const preview = await loadRecipePreview(id).catch((error: unknown) => {
    // The owner check ends in notFound(), which has to reach Next.js
    unstable_rethrow(error)
    logger.error('Could not load the recipe preview', { id, error })
    return undefined
  })
  if (!preview) notFound()
  const { recipe, status } = preview

  return (
    <LandingPageTemplate>
      <div className='border-b border-text-muted/20 bg-surface'>
        <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 p-3 sm:px-6 lg:px-8'>
          <p className='flex flex-wrap items-center gap-3 text-sm text-text-muted'>
            <Badge>{status === 'published' ? 'Published' : 'Draft'}</Badge>
            <span>
              Preview of the saved recipe.
              {status === 'draft' &&
                ' Visitors cannot see it until you publish.'}
            </span>
          </p>
          <div className='flex gap-2'>
            <Button
              href={`/admin/recipes/${id}/edit`}
              size='sm'
              variant='outline'
            >
              Back to editor
            </Button>
            <Button href='/admin' size='sm' variant='outline'>
              All recipes
            </Button>
          </div>
        </div>
      </div>
      <RecipePageContent recipe={recipe} />
    </LandingPageTemplate>
  )
}

export default PreviewPage
