'use client'

import type { ReactElement } from 'react'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { RecipeStatus } from '@/libs/recipes'

import { useSetRecipeStatus } from '@/apiClients'
import { Button } from '@/components/atoms'

type RecipePublishButtonProps = {
  id: string
  status: RecipeStatus
}

// Flips a recipe between draft and published through the setRecipeStatus mutation, then
// refreshes the page so the list or editor shows the new status
export const RecipePublishButton = ({
  id,
  status,
}: RecipePublishButtonProps): ReactElement => {
  const router = useRouter()
  const setRecipeStatus = useSetRecipeStatus()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()
  const isPublished = status === 'published'

  const toggle = async (): Promise<void> => {
    setError(undefined)
    setIsPending(true)
    try {
      await setRecipeStatus(id, isPublished ? 'draft' : 'published')
      router.refresh()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Could not change the status.'
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Button size='sm' disabled={isPending} onClick={toggle}>
        {isPublished ? 'Unpublish' : 'Publish'}
      </Button>
      {error && (
        <span role='alert' className='text-sm text-red-400'>
          {error}
        </span>
      )}
    </>
  )
}
