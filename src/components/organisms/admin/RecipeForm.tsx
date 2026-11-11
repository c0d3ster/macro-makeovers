'use client'

import type { ReactElement } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'

import type { SaveRecipeResult } from '@/apiClients'
import type {
  PhotoResponse,
  RecipeImport,
  RecipeImportInput,
} from '@/validations'

import {
  chooseBuildPhoto,
  chooseRecipePhoto,
  clearBuildPhoto,
  useSaveRecipe,
} from '@/apiClients'
import { Button } from '@/components/atoms'
import {
  RECIPE_BODY_GRID,
  RECIPE_BODY_INGREDIENTS,
  RECIPE_BODY_NUTRITION,
  RECIPE_BODY_STEPS,
  RECIPE_PAGE_LAYOUT,
} from '@/components/organisms/recipe/recipeLayout'
import { recipeImportSchema } from '@/validations'

import type { BuildPreviewValue } from './buildPreview'

import { BuildPreviewContext } from './buildPreview'
import { RecipeHeroEditor } from './RecipeHeroEditor'
import { RecipeIngredientsEditor } from './RecipeIngredientsEditor'
import { RecipeNotesEditor } from './RecipeNotesEditor'
import { RecipeNutritionEditor } from './RecipeNutritionEditor'
import { RecipeStepsEditor } from './RecipeStepsEditor'

type RecipeFormProps = {
  // Set when editing. The slug is then fixed, because it is the recipe's address.
  recipeId?: string
  initial?: RecipeImportInput
  imageUrl?: string
  // Each saved build's own photo by key
  buildImages?: Record<string, string>
}

const EMPTY_RECIPE: RecipeImportInput = {
  slug: '',
  title: '',
  summary: '',
  servings: 4,
  prepMinutes: 15,
  cookMinutes: 30,
  costTier: 2,
  difficulty: 2,
  tags: [],
  builds: [
    {
      key: 'makeover',
      label: 'Makeover',
      isDefault: true,
      listed: true,
      calories: 0,
      carbsG: 0,
      fatG: 0,
      proteinG: 0,
    },
  ],
  nutrition: [],
  ingredients: [{ raw: '' }],
  steps: [{ phase: 'prep', body: '' }],
  notes: [],
}

// The recipe page with its content as fields, laid out on the same grid, so writing a recipe
// shows how it will read. Each section edits one part of the import shape.
export const RecipeForm = ({
  recipeId,
  initial = EMPTY_RECIPE,
  imageUrl,
  buildImages: savedBuildImages = {},
}: RecipeFormProps): ReactElement => {
  const router = useRouter()
  const saveRecipe = useSaveRecipe()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SaveRecipeResult>()
  // A photo picked before the first save, attached once the recipe exists
  const [pendingPhoto, setPendingPhoto] = useState<string>()
  // The recipe photo as it stands, which builds without their own photo fall back to
  const [recipeImage, setRecipeImage] = useState(imageUrl)
  // The build the editor previews. Undefined is the featured build.
  const [previewKey, setPreviewKey] = useState<string>()
  // Build photos as the editor shows them, saved or waiting
  const [buildImages, setBuildImages] = useState(savedBuildImages)
  // Build photos picked for a build the database does not have yet (new or renamed), by key.
  // They attach after the next save.
  const [pendingBuildPhotos, setPendingBuildPhotos] = useState<
    Record<string, string>
  >({})
  const [savedBuildKeys, setSavedBuildKeys] = useState(
    () =>
      new Set(
        recipeId
          ? (initial.builds ?? []).flatMap(({ key }) => (key ? [key] : []))
          : []
      )
  )

  const form = useForm<RecipeImportInput, unknown, RecipeImport>({
    resolver: zodResolver(recipeImportSchema),
    defaultValues: initial,
  })
  const notes = useFieldArray({ control: form.control, name: 'notes' })

  // Build photos that failed to attach after the last save, kept queued for a retry
  const [failedBuildPhotos, setFailedBuildPhotos] = useState<string[]>([])

  // Attaches queued build photos to builds the database now has. Only the photos that attach
  // leave the queue, so one picked while saving, or one that failed, stays for the next try.
  const attachBuildPhotos = async (
    id: string,
    waiting: [string, string][]
  ): Promise<void> => {
    const attached: [string, string][] = []
    const failed: string[] = []
    for (const [key, url] of waiting) {
      const chosen = await chooseBuildPhoto(id, key, url)
      if (chosen.ok) attached.push([key, url])
      else failed.push(key)
    }
    setPendingBuildPhotos((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key, url]) => !attached.some(([doneKey, doneUrl]) => doneKey === key && doneUrl === url)
        )
      )
    )
    setFailedBuildPhotos(failed)
  }

  const retryBuildPhotos = (): void => {
    if (!recipeId) return
    startTransition(async () => {
      await attachBuildPhotos(
        recipeId,
        Object.entries(pendingBuildPhotos).filter(([key]) => failedBuildPhotos.includes(key))
      )
    })
  }

  const save = form.handleSubmit((values) => {
    setResult(undefined)
    startTransition(async () => {
      const saved = await saveRecipe(recipeId, values)
      setResult(saved)
      if (!saved.ok) return

      // Every build now exists, so photos waiting on a save attach
      const waiting = Object.entries(pendingBuildPhotos).filter(([key]) =>
        values.builds.some((build) => build.key === key)
      )
      await attachBuildPhotos(saved.id, waiting)
      setSavedBuildKeys(new Set(values.builds.map(({ key }) => key)))
      if (recipeId) return

      // The recipe exists now, so the editor opens even if the photo fails to attach. Saving
      // here again would try to create it a second time. The photo can be picked again there.
      if (pendingPhoto) await chooseRecipePhoto(saved.id, pendingPhoto)
      router.push(`/admin/recipes/${saved.id}/edit`)
    })
  })

  const choosePhoto = async (url: string): Promise<PhotoResponse> => {
    if (recipeId) {
      const chosen = await chooseRecipePhoto(recipeId, url)
      if (chosen.ok) setRecipeImage(chosen.url)
      return chosen
    }
    setPendingPhoto(url)
    setRecipeImage(url)
    return { ok: true, url }
  }

  // A saved build takes its photo now. A build not saved yet holds it until the next save.
  const chooseBuildImage = async (
    key: string,
    url: string
  ): Promise<PhotoResponse> => {
    if (recipeId && savedBuildKeys.has(key)) {
      const chosen = await chooseBuildPhoto(recipeId, key, url)
      if (chosen.ok) setBuildImages((images) => ({ ...images, [key]: chosen.url }))
      return chosen
    }
    setPendingBuildPhotos((photos) => ({ ...photos, [key]: url }))
    setBuildImages((images) => ({ ...images, [key]: url }))
    return { ok: true, url }
  }

  const clearBuildImage = async (
    key: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const drop = <T,>(record: Record<string, T>): Record<string, T> =>
      Object.fromEntries(Object.entries(record).filter(([item]) => item !== key))
    if (recipeId && savedBuildKeys.has(key) && !pendingBuildPhotos[key]) {
      const cleared = await clearBuildPhoto(recipeId, key)
      if (!cleared.ok) return cleared
    }
    setPendingBuildPhotos(drop)
    setBuildImages(drop)
    return { ok: true }
  }

  const preview: BuildPreviewValue = {
    selectedKey: previewKey,
    select: setPreviewKey,
    buildImages,
    isBuildSaved: (key) => Boolean(recipeId) && savedBuildKeys.has(key),
    // A renamed build is a new row on save, so its photo waits to be attached under the new key
    renameKey: (from, to) => {
      const photo = buildImages[from]
      if (photo) {
        setBuildImages(({ [from]: _old, ...rest }) => ({ ...rest, [to]: photo }))
        setPendingBuildPhotos(({ [from]: _old, ...rest }) => ({
          ...rest,
          [to]: photo,
        }))
      }
      if (previewKey === from) setPreviewKey(to)
    },
  }

  return (
    <FormProvider {...form}>
      <BuildPreviewContext value={preview}>
      <form onSubmit={save} noValidate>
        <div className={RECIPE_PAGE_LAYOUT}>
          <RecipeHeroEditor
            recipeId={recipeId}
            imageUrl={recipeImage}
            onChoosePhoto={choosePhoto}
            onChooseBuildPhoto={chooseBuildImage}
            onClearBuildPhoto={clearBuildImage}
          />
          <div className={RECIPE_BODY_GRID}>
            <div className={RECIPE_BODY_NUTRITION}>
              <RecipeNutritionEditor notes={notes} />
            </div>
            <div className={RECIPE_BODY_INGREDIENTS}>
              <RecipeIngredientsEditor />
            </div>
            <div className={RECIPE_BODY_STEPS}>
              <RecipeStepsEditor />
            </div>
          </div>
          <RecipeNotesEditor notes={notes} />
        </div>

        <div className='sticky bottom-0 z-20 border-t border-text-muted/20 bg-background'>
          <div className='mx-auto flex max-w-6xl flex-wrap items-center gap-4 p-3 sm:px-6 lg:px-8'>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
            {result?.ok && (
              <p role='status' className='text-sm text-text'>
                {result.summary}
              </p>
            )}
            {failedBuildPhotos.length > 0 && (
              <div role='alert' className='flex items-center gap-3 text-sm text-red-400'>
                <p>
                  The photo for {failedBuildPhotos.join(', ')} did not attach.
                </p>
                {recipeId && (
                  <button
                    type='button'
                    onClick={retryBuildPhotos}
                    disabled={isPending}
                    className='cursor-pointer underline hover:no-underline'
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
            {result && !result.ok && (
              <div role='alert' className='text-sm text-red-400'>
                <p>{result.error}</p>
                {result.issues?.map(({ path, message }) => (
                  <p key={`${path}:${message}`}>
                    {path}: {message}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
      </BuildPreviewContext>
    </FormProvider>
  )
}
