'use client'

import type { ReactElement } from 'react'

import { Button } from '@/components/atoms'
import { useIsOwner } from '@/providers'

type OwnerEditLinkProps = {
  recipeId: string
}

// Only the owner sees it. The check runs in the browser so the cached recipe page stays cached.
// It sits in the page's top padding, so showing up a moment after load never moves the page.
export const OwnerEditLink = ({
  recipeId,
}: OwnerEditLinkProps): ReactElement | null => {
  const isOwner = useIsOwner()
  if (!isOwner) return null

  return (
    <div className='absolute top-1 right-3 sm:right-6 lg:right-8'>
      <Button
        href={`/admin/recipes/${recipeId}/edit`}
        size='sm'
        variant='outline'
      >
        Edit recipe
      </Button>
    </div>
  )
}
