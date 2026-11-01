import type { ReactElement } from 'react'

import Link from 'next/link'

import type { RecipeStatus } from '@/libs/recipes'

import { Badge, Button } from '@/components/atoms'

type RecipePublishControlsProps = {
  id: string
  slug: string
  status: RecipeStatus
  // The server action that sets a recipe's status, the same one the recipe list uses
  action: (formData: FormData) => Promise<void>
}

// Status and the publish switch for one recipe. It publishes what is saved, so a recipe with
// unsaved edits publishes without them.
export const RecipePublishControls = ({
  id,
  slug,
  status,
  action,
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
      <form action={action}>
        <input type='hidden' name='id' value={id} />
        <input
          type='hidden'
          name='status'
          value={isPublished ? 'draft' : 'published'}
        />
        <Button type='submit' size='sm'>
          {isPublished ? 'Unpublish' : 'Publish'}
        </Button>
      </form>
    </div>
  )
}
