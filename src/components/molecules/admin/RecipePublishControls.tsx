import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RecipeStatus } from '@/libs/recipes'

import { Badge } from '@/components/atoms'

import { RecipePublishButton } from './RecipePublishButton'

type RecipePublishControlsProps = {
  id: string
  slug: string
  status: RecipeStatus
}

// Status and the publish switch for one recipe. It publishes what is saved, so a recipe with
// unsaved edits publishes without them.
export const RecipePublishControls = ({
  id,
  slug,
  status,
}: RecipePublishControlsProps): ReactElement => {
  const isPublished = status === 'published'

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <Badge>{isPublished ? 'Published' : 'Draft'}</Badge>
      {isPublished && (
        <Link
          href={`/recipes/${slug}`}
          className='text-sm text-text-muted underline hover:text-text'
        >
          View live
        </Link>
      )}
      <RecipePublishButton id={id} status={status} />
    </div>
  )
}
