'use client'

import type { ChangeEvent, ReactElement, RefObject } from 'react'

import { useRef, useState, useTransition } from 'react'
import { useWatch } from 'react-hook-form'

import type { PhotoResponse } from '@/validations'

import { generateRecipePhoto, uploadRecipePhoto } from '@/apiClients'
import { Button, RecipeImage } from '@/components/atoms'
import { InlineTextarea } from '@/components/molecules'
import { shrinkPhoto } from '@/utils/shrinkPhoto'
import { MAX_PHOTO_BYTES, PHOTO_TYPES } from '@/validations'

import { useRecipeForm } from './recipeFormFields'

type PhotoFailure = Extract<PhotoResponse, { ok: false }>

type RecipePhotoEditorProps = {
  imageUrl?: string
  // Makes a photo the recipe's own. A recipe not saved yet holds it until its first save.
  onChoose: (url: string) => Promise<PhotoResponse>
  isSaved: boolean
}

const STAGE_LABELS: Record<PhotoFailure['stage'], string> = {
  request: 'Request',
  config: 'Setup',
  source: 'Photo',
  generate: 'Image generation',
  optimize: 'Image processing',
  upload: 'Upload',
  save: 'Save',
}

const failureMessage = (failure: PhotoFailure): string =>
  `${STAGE_LABELS[failure.stage]} failed: ${failure.error}`

// Shrunk so a phone photo fits the upload limit, then checked. A browser that cannot shrink it
// sends it as it is, and the size check still applies.
const preparePhoto = async (
  file: File
): Promise<{ file: File } | { problem: string }> => {
  if (!PHOTO_TYPES.includes(file.type)) {
    return { problem: 'A photo must be a JPEG, PNG, or WebP.' }
  }
  const shrunk = await shrinkPhoto(file).catch(() => file)
  if (shrunk.size > MAX_PHOTO_BYTES) {
    return { problem: 'A photo must be 4 MB or smaller.' }
  }
  return { file: shrunk }
}

type PhotoPickerProps = {
  label: string
  onPick: (file: File) => void
  inputRef: RefObject<HTMLInputElement | null>
}

// A file input the buttons open, so picking a file looks like the rest of the editor
const PhotoPicker = ({
  label,
  onPick,
  inputRef,
}: PhotoPickerProps): ReactElement => (
  <input
    ref={inputRef}
    type='file'
    aria-label={label}
    accept={PHOTO_TYPES.join(',')}
    className='sr-only'
    tabIndex={-1}
    onChange={(event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (file) onPick(file)
    }}
  />
)

// The photo slot in the editor. A photo can be uploaded or generated from the title and summary
// on screen, saved or not. Either one is a candidate to look at first, and the recipe's photo
// only changes when it is chosen.
export const RecipePhotoEditor = ({
  imageUrl,
  onChoose,
  isSaved,
}: RecipePhotoEditorProps): ReactElement => {
  const { control, getValues } = useRecipeForm()
  const title = useWatch({ control, name: 'title' })
  const uploadRef = useRef<HTMLInputElement>(null)
  const referenceRef = useRef<HTMLInputElement>(null)

  const [livePhoto, setLivePhoto] = useState(imageUrl)
  const [candidate, setCandidate] = useState<string>()
  const [notes, setNotes] = useState('')
  const [reference, setReference] = useState<File>()
  const [useCurrent, setUseCurrent] = useState(false)
  const [error, setError] = useState<string>()
  const [status, setStatus] = useState<string>()
  const [isWorking, startWorking] = useTransition()
  const shownPhoto = candidate ?? livePhoto

  const showCandidate = (result: PhotoResponse, message: string): void => {
    if (!result.ok) {
      setError(failureMessage(result))
      return
    }
    setCandidate(result.url)
    setStatus(message)
  }

  const run = (work: () => Promise<void>): void => {
    setError(undefined)
    setStatus(undefined)
    startWorking(work)
  }

  const upload = (file: File): void =>
    run(async () => {
      const prepared = await preparePhoto(file)
      if ('problem' in prepared) {
        setError(prepared.problem)
        return
      }
      const request = new FormData()
      request.set('photo', prepared.file)
      request.set('slug', getValues('slug'))
      showCandidate(
        await uploadRecipePhoto(request),
        'Uploaded. Use it, or generate from it with the photo below.'
      )
    })

  const pickReference = (file: File): void =>
    run(async () => {
      const prepared = await preparePhoto(file)
      if ('problem' in prepared) {
        setError(prepared.problem)
        return
      }
      setReference(prepared.file)
    })

  const generate = (): void => {
    const request = new FormData()
    request.set('slug', getValues('slug'))
    request.set('title', getValues('title'))
    request.set('summary', getValues('summary'))
    request.set('notes', notes)
    if (reference) request.set('reference', reference)
    if (useCurrent && shownPhoto) request.set('sourceUrl', shownPhoto)

    run(async () => {
      showCandidate(
        await generateRecipePhoto(request),
        'Here is a new option. The recipe photo has not changed.'
      )
    })
  }

  const choose = (url: string): void =>
    run(async () => {
      const result = await onChoose(url)
      if (!result.ok) {
        setError(failureMessage(result))
        return
      }
      setLivePhoto(result.url)
      setCandidate(undefined)
      setStatus(
        isSaved ? 'Photo saved.' : 'This photo will be saved with the recipe.'
      )
    })

  const discard = (): void => {
    setCandidate(undefined)
    setError(undefined)
    setStatus(undefined)
  }

  return (
    <div className='flex flex-col gap-3'>
      <PhotoPicker label='Upload a photo' inputRef={uploadRef} onPick={upload} />
      <PhotoPicker
        label='Reference photo'
        inputRef={referenceRef}
        onPick={pickReference}
      />

      {shownPhoto ? (
        <div className='relative'>
          <RecipeImage imageUrl={shownPhoto} title={title} />
          {candidate && (
            <span className='absolute top-2 left-2 rounded-full bg-background px-2.5 py-0.5 text-xs text-text'>
              Not saved yet
            </span>
          )}
        </div>
      ) : (
        <button
          type='button'
          onClick={() => uploadRef.current?.click()}
          disabled={isWorking}
          className='cursor-pointer rounded-xl transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-wait'
        >
          <RecipeImage
            title={title}
            placeholderText='Import photo or generate below'
          />
        </button>
      )}

      <InlineTextarea
        label='Photo notes'
        rows={2}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder='Optional: more char on the cheese, shot from the side'
        className='text-sm text-text'
      />

      <div className='flex flex-col gap-2 text-sm text-text-muted'>
        <div className='flex flex-wrap items-center gap-2'>
          {reference ? (
            <>
              <span className='min-w-0 truncate'>Reference: {reference.name}</span>
              <button
                type='button'
                onClick={() => setReference(undefined)}
                className='cursor-pointer text-primary underline hover:no-underline'
              >
                Remove
              </button>
            </>
          ) : (
            <Button
              size='sm'
              variant='outline'
              disabled={isWorking}
              onClick={() => referenceRef.current?.click()}
            >
              Add reference photo
            </Button>
          )}
        </div>
        {shownPhoto && (
          <label className='flex cursor-pointer items-center gap-2'>
            <input
              type='checkbox'
              checked={useCurrent}
              onChange={(event) => setUseCurrent(event.target.checked)}
            />
            Use the current photo as a reference
          </label>
        )}
        <p className='text-xs'>References go to the image model and are not stored.</p>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Button
          size='sm'
          variant={candidate ? 'outline' : 'solid'}
          disabled={isWorking}
          onClick={generate}
        >
          {isWorking ? 'Working, this can take a minute...' : 'Generate photo'}
        </Button>
        <Button
          size='sm'
          variant='outline'
          disabled={isWorking}
          onClick={() => uploadRef.current?.click()}
        >
          Upload photo
        </Button>
        {candidate && (
          <>
            <Button size='sm' disabled={isWorking} onClick={() => choose(candidate)}>
              Use this photo
            </Button>
            <Button
              size='sm'
              variant='outline'
              disabled={isWorking}
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
