'use client'

import type { ReactElement } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'

import type { SaveRecipeResult } from '@/apiClients'
import type { RecipeImport, RecipeImportInput } from '@/validations'

import { useSaveRecipe } from '@/apiClients'
import { Button } from '@/components/atoms'
import {
  RECIPE_BODY_GRID,
  RECIPE_BODY_INGREDIENTS,
  RECIPE_BODY_NUTRITION,
  RECIPE_BODY_STEPS,
  RECIPE_PAGE_LAYOUT,
} from '@/components/organisms/recipe/recipeLayout'
import { recipeImportSchema } from '@/validations'

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
  nutrition: [
    {
      kind: 'makeover',
      label: 'Makeover',
      isDefault: true,
      calories: 0,
      carbsG: 0,
      fatG: 0,
      proteinG: 0,
    },
  ],
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
}: RecipeFormProps): ReactElement => {
  const router = useRouter()
  const saveRecipe = useSaveRecipe()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SaveRecipeResult>()

  const form = useForm<RecipeImportInput, unknown, RecipeImport>({
    resolver: zodResolver(recipeImportSchema),
    defaultValues: initial,
  })
  const notes = useFieldArray({ control: form.control, name: 'notes' })

  const save = form.handleSubmit((values) => {
    setResult(undefined)
    startTransition(async () => {
      const saved = await saveRecipe(recipeId, values)
      setResult(saved)
      if (saved.ok && !recipeId) router.push(`/admin/recipes/${saved.id}/edit`)
    })
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={save} noValidate>
        <div className={RECIPE_PAGE_LAYOUT}>
          <RecipeHeroEditor
            recipeId={recipeId}
            imageUrl={imageUrl}
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
            {recipeId && (
              <Button
                href={`/admin/recipes/${recipeId}/preview`}
                external
                variant='outline'
              >
                Preview saved version
              </Button>
            )}
            {result?.ok && (
              <p role='status' className='text-sm text-text'>
                {result.summary}
              </p>
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
    </FormProvider>
  )
}
