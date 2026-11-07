import type { ReactElement, ReactNode } from 'react'

import Link from 'next/link'

import type { RecipeStatus } from '@/libs/recipes'

import { Badge } from '@/components/atoms'

import { RecipePublishButton } from './RecipePublishButton'

type RecipePublishControlsProps = {
  id: string
  slug: string
  status: RecipeStatus
  // Extra actions beside the publish button, like delete
  children?: ReactNode
}

// Status and the publish switch for one recipe. It publishes what is saved, so a recipe with
// unsaved edits publishes without them.
export const RecipePublishControls = ({
  id,
  slug,
  status,
  children,
}: RecipePublishControlsProps): ReactElement => {
  const isPublished = status === 'published'

  return (
    <div className='flex flex-wrap items-center justify-end gap-3'>
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
      {children}
    </div>
  )
}
