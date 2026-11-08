'use client'

import type { ReactElement } from 'react'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useDeleteRecipe } from '@/apiClients'
import { Button } from '@/components/atoms'

import { ConfirmDialog } from './ConfirmDialog'

type RecipeDeleteButtonProps = {
  id: string
  title: string
  // Where to go after the recipe is gone, for pages that would otherwise show a missing recipe
  redirectTo?: string
}

// Red outline, so it reads as the risky one next to the publish button
const DANGER =
  'border-red-500/70 text-red-500 hover:border-red-500 hover:bg-red-500/10 hover:text-red-500'

// Deleting is permanent, so the first click only asks, in a dialog over the page. Confirming
// deletes the recipe, its ingredients, steps, notes and revision history.
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

  return (
    <>
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
      {isAsking && (
        <ConfirmDialog
          title='Delete recipe?'
          confirmLabel='Yes, delete'
          pendingLabel='Deleting...'
          isPending={isPending}
          error={error}
          onConfirm={() => void confirm()}
          onCancel={() => setIsAsking(false)}
        >
          &ldquo;{title}&rdquo; and its ingredients, steps, notes, and revision
          history will be deleted for good. This can&apos;t be undone.
        </ConfirmDialog>
      )}
    </>
  )
}
