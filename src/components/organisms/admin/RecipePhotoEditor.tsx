'use client'

import type { ChangeEvent, ReactElement } from 'react'

import { useState, useTransition } from 'react'
import { useWatch } from 'react-hook-form'

import type { PhotoResponse } from '@/validations'

import { chooseRecipePhoto, generateRecipePhoto } from '@/apiClients'
import { Button, RecipeImage } from '@/components/atoms'
import { InlineTextarea } from '@/components/molecules'
import { MAX_REFERENCE_BYTES, REFERENCE_TYPES } from '@/validations'

import { useRecipeForm } from './recipeFormFields'

type RecipePhotoEditorProps = {
  // Unset until the recipe's first save, since a photo belongs to a saved recipe
  recipeId?: string
  imageUrl?: string
}

const STAGE_LABELS: Record<
  Extract<PhotoResponse, { ok: false }>['stage'],
  string
> = {
  request: 'Request',
  config: 'Setup',
  source: 'Source photo',
  generate: 'Image generation',
  optimize: 'Image processing',
  upload: 'Upload',
  save: 'Save',
}

const failureMessage = (
  failure: Extract<PhotoResponse, { ok: false }>
): string => `${STAGE_LABELS[failure.stage]} failed: ${failure.error}`

// The photo slot in the editor. Generating uses the title and summary on screen, saved or not, and
// makes a candidate to look at. The live photo only changes when the owner picks one.
export const RecipePhotoEditor = ({
  recipeId,
  imageUrl,
}: RecipePhotoEditorProps): ReactElement => {
  const { control, getValues } = useRecipeForm()
  const title = useWatch({ control, name: 'title' })

  const [livePhoto, setLivePhoto] = useState(imageUrl)
  const [candidate, setCandidate] = useState<string>()
  const [notes, setNotes] = useState('')
  const [reference, setReference] = useState<File>()
  // Remounting clears the file input, which has no value to set
  const [referenceInput, setReferenceInput] = useState(0)
  const [refine, setRefine] = useState(false)
  const [error, setError] = useState<string>()
  const [status, setStatus] = useState<string>()
  const [isGenerating, startGenerating] = useTransition()
  const [isChoosing, startChoosing] = useTransition()
  const isBusy = isGenerating || isChoosing
  const shownPhoto = candidate ?? livePhoto

  if (!recipeId) {
    return (
      <div className='flex flex-col gap-2'>
        <RecipeImage title={title} />
        <p className='text-sm text-text-muted'>
          Save the recipe to generate its photo.
        </p>
      </div>
    )
  }

  const clearReference = (): void => {
    setReference(undefined)
    setReferenceInput((current) => current + 1)
  }

  const onPickReference = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    setError(undefined)
    if (!file) return

    if (!REFERENCE_TYPES.includes(file.type)) {
      setError('A reference must be a JPEG, PNG, or WebP.')
      clearReference()
      return
    }
    if (file.size > MAX_REFERENCE_BYTES) {
      setError('A reference photo must be 4 MB or smaller.')
      clearReference()
      return
    }
    setReference(file)
  }

  const generate = (): void => {
    const request = new FormData()
    request.set('title', getValues('title'))
    request.set('summary', getValues('summary'))
    request.set('notes', notes)
    if (reference) request.set('reference', reference)
    if (refine && shownPhoto) request.set('sourceUrl', shownPhoto)

    setError(undefined)
    setStatus(undefined)
    startGenerating(async () => {
      const result = await generateRecipePhoto(recipeId, request)
      if (!result.ok) {
        setError(failureMessage(result))
        return
      }
      setCandidate(result.url)
      setRefine(true)
      setStatus('Here is a new option. The live photo has not changed.')
    })
  }

  const choose = (url: string): void => {
    setError(undefined)
    setStatus(undefined)
    startChoosing(async () => {
      const result = await chooseRecipePhoto(recipeId, url)
      if (!result.ok) {
        setError(failureMessage(result))
        return
      }
      setLivePhoto(result.url)
      setCandidate(undefined)
      setRefine(false)
      setStatus('Photo saved.')
    })
  }

  const discard = (): void => {
    setCandidate(undefined)
    setRefine(false)
    setError(undefined)
    setStatus(undefined)
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='relative'>
        <RecipeImage imageUrl={shownPhoto} title={title} />
        {candidate && (
          <span className='absolute top-2 left-2 rounded-full bg-background px-2.5 py-0.5 text-xs text-text'>
            Not saved yet
          </span>
        )}
      </div>

      <InlineTextarea
        label='Photo notes'
        rows={2}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder='Optional: more char on the cheese, shot from the side'
        className='text-sm text-text'
      />

      <div className='flex flex-col gap-1.5 text-sm text-text-muted'>
        {reference ? (
          <p className='flex items-center gap-2'>
            <span className='min-w-0 truncate'>Reference: {reference.name}</span>
            <button
              type='button'
              onClick={clearReference}
              className='cursor-pointer text-primary underline hover:no-underline'
            >
              Remove
            </button>
          </p>
        ) : (
          <label className='flex flex-col gap-1'>
            Reference photo (optional, not stored)
            <input
              key={referenceInput}
              type='file'
              accept={REFERENCE_TYPES.join(',')}
              onChange={onPickReference}
              className='text-xs'
            />
          </label>
        )}
        {shownPhoto && (
          <label className='flex cursor-pointer items-center gap-2'>
            <input
              type='checkbox'
              checked={refine}
              onChange={(event) => setRefine(event.target.checked)}
            />
            Start from the photo shown
          </label>
        )}
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Button
          size='sm'
          variant={candidate ? 'outline' : 'solid'}
          disabled={isBusy}
          onClick={generate}
        >
          {isGenerating
            ? 'Generating, this can take a minute...'
            : candidate
              ? 'Try again'
              : 'Generate photo'}
        </Button>
        {candidate && (
          <>
            <Button size='sm' disabled={isBusy} onClick={() => choose(candidate)}>
              {isChoosing ? 'Saving...' : 'Use this photo'}
            </Button>
            <Button
              size='sm'
              variant='outline'
              disabled={isBusy}
              onClick={discard}
            >
              Discard
            </Button>
          </>
        )}
      </div>

      {status && (
        <p role='status' className='text-sm text-text-muted'>
          {status}
        </p>
      )}
      {error && (
        <p role='alert' className='text-sm text-red-400'>
          {error}
        </p>
      )}
    </div>
  )
}
