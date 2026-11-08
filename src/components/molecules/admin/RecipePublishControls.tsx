import type { ReactElement, ReactNode } from 'react'

import Link from 'next/link'

import type { RecipeStatus } from '@/libs/recipes'

import { Badge } from '@/components/atoms'

import { RecipePublishButton } from './RecipePublishButton'

type RecipePublishControlsProps = {
  id: string
  slug: string
  status: RecipeStatus
  // Extra actions after the publish button, like delete
  children?: ReactNode
}

const LINK_CLASS = 'text-sm text-text-muted underline hover:text-text'

// The actions for one recipe, with its status always last on the right. A published recipe links
// to its live page. A draft has no public page yet, so it links to the preview instead. Publishing
// uses what is saved, so unsaved edits are left out.
export const RecipePublishControls = ({
  id,
  slug,
  status,
  children,
}: RecipePublishControlsProps): ReactElement => {
  const isPublished = status === 'published'

  return (
    <div className='flex flex-wrap items-center justify-end gap-3'>
      {isPublished ? (
        <Link href={`/recipes/${slug}`} className={LINK_CLASS}>
          View live
        </Link>
      ) : (
        <Link
          href={`/admin/recipes/${id}/preview`}
          title='The saved draft as visitors will see it'
          className={LINK_CLASS}
        >
          Preview
        </Link>
      )}
      <RecipePublishButton id={id} status={status} />
      {children}
      <Badge>{isPublished ? 'Published' : 'Draft'}</Badge>
    </div>
  )
}
