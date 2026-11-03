'use client'

import type { ReactElement } from 'react'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useDeleteRecipe } from '@/apiClients'
import { Button } from '@/components/atoms'

type RecipeDeleteButtonProps = {
  id: string
  title: string
  // Where to go after the recipe is gone, for pages that would otherwise show a missing recipe
  redirectTo?: string
}

// Red outline, so it reads as the risky one next to the publish button
const DANGER =
  'border-red-500/70 text-red-500 hover:border-red-500 hover:bg-red-500/10 hover:text-red-500'

// Deleting is permanent, so the first click only asks. The second click deletes the recipe,
// its ingredients, steps, notes and revision history.
export const RecipeDeleteButton = ({
  id,
  title,
  redirectTo,
}: RecipeDeleteButtonProps): ReactElement => {
  const router = useRouter()
  const deleteRecipe = useDeleteRecipe()
  const [isAsking, setIsAsking] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()

  const confirm = async (): Promise<void> => {
    setError(undefined)
    setIsPending(true)
    try {
      await deleteRecipe(id)
      if (redirectTo) router.push(redirectTo)
      router.refresh()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Could not delete the recipe.'
      )
      setIsPending(false)
    }
  }

  if (!isAsking) {
    return (
      <Button
        size='sm'
        variant='outline'
        className={DANGER}
        onClick={() => {
          setError(undefined)
          setIsAsking(true)
        }}
      >
        Delete
      </Button>
    )
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <span className='text-sm text-text'>
        Delete &ldquo;{title}&rdquo; for good?
      </span>
      <Button
        size='sm'
        disabled={isPending}
        onClick={confirm}
        className='border border-red-500 bg-red-500 text-white hover:bg-red-600'
      >
        {isPending ? 'Deleting...' : 'Yes, delete'}
      </Button>
      <Button
        size='sm'
        variant='outline'
        disabled={isPending}
        onClick={() => setIsAsking(false)}
      >
        Cancel
      </Button>
      {error && (
        <span role='alert' className='text-sm text-red-400'>
          {error}
        </span>
      )}
    </div>
  )
}
