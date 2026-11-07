'use client'

import type { KeyboardEvent, ReactElement } from 'react'

import { useController, useWatch } from 'react-hook-form'

import { RecipeImage } from '@/components/atoms'
import {
  InlineInput,
  InlineTextarea,
  RecipeMacroSummary,
  ScalePicker,
  TagInput,
} from '@/components/molecules'
import {
  RECIPE_HERO_BODY,
  RECIPE_HERO_FACTS,
  RECIPE_HERO_GRID,
  RECIPE_HERO_PHOTO,
  RECIPE_HERO_TITLE,
} from '@/components/organisms/recipe/recipeLayout'
import { featuredBuild } from '@/libs/recipes/recipeDetail'
import { formatMinutes } from '@/utils/formatMinutes'

import {
  numberField,
  optionalText,
  toNumber,
  toNutritionBuild,
  useRecipeForm,
} from './recipeFormFields'

type RecipeHeroEditorProps = {
  // The slug is the recipe's address, so it locks once the recipe exists
  slugLocked: boolean
  imageUrl?: string
}

// A title is one line of text, however far it wraps
const blockEnter = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
  if (event.key === 'Enter') event.preventDefault()
}

const costSymbol = (isLit: boolean): ReactElement => (
  <span
    aria-hidden='true'
    className={`font-medium ${isLit ? 'text-accent' : 'text-text-muted/40'}`}
  >
    $
  </span>
)

const difficultySymbol = (isLit: boolean): ReactElement => (
  <span
    aria-hidden='true'
    className={`size-2.5 rounded-full ${isLit ? 'bg-primary' : 'bg-text-muted/30'}`}
  />
)

// The top of the recipe page with its text as fields. Calories and the macro bar are worked out
// from the nutrition table below, and update while it is edited.
export const RecipeHeroEditor = ({
  slugLocked,
  imageUrl,
}: RecipeHeroEditorProps): ReactElement => {
  const {
    control,
    register,
    formState: { errors },
  } = useRecipeForm()
  const cost = useController({ control, name: 'costTier' })
  const difficulty = useController({ control, name: 'difficulty' })
  const tags = useController({ control, name: 'tags' })
  const title = useWatch({ control, name: 'title' })
  const prepMinutes = useWatch({ control, name: 'prepMinutes' })
  const cookMinutes = useWatch({ control, name: 'cookMinutes' })
  const rows = useWatch({ control, name: 'nutrition' })

  const builds = rows.map(toNutritionBuild)
  const featured = featuredBuild(builds)
  const original = builds.find(({ kind }) => kind === 'traditional')

  return (
    <header className={RECIPE_HERO_GRID}>
      <InlineTextarea
        label='Title'
        error={errors.title?.message}
        fieldClassName={RECIPE_HERO_TITLE}
        rows={1}
        placeholder='Recipe title'
        onKeyDown={blockEnter}
        className='text-4xl font-bold text-text'
        {...register('title')}
      />

      <div className={RECIPE_HERO_FACTS}>
        <p className='flex items-center gap-2'>
          Total
          <span className='text-text'>
            {formatMinutes(toNumber(prepMinutes) + toNumber(cookMinutes))}
          </span>
        </p>
        <ScalePicker
          label='Cost'
          value={cost.field.value}
          onChange={cost.field.onChange}
          renderSymbol={costSymbol}
          error={errors.costTier?.message}
        />
        <ScalePicker
          label='Difficulty'
          value={difficulty.field.value}
          onChange={difficulty.field.onChange}
          renderSymbol={difficultySymbol}
          error={errors.difficulty?.message}
        />
      </div>

      <div className={RECIPE_HERO_BODY}>
        <InlineTextarea
          label='Summary'
          error={errors.summary?.message}
          fieldClassName='max-w-3xl'
          rows={3}
          placeholder='What makes this recipe worth making?'
          className='text-text-muted'
          {...register('summary')}
        />

        <div className='flex max-w-xl flex-col gap-3'>
          <div className='flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1'>
            <p className='flex items-baseline gap-2'>
              <span className='text-4xl leading-none font-semibold text-text'>
                {featured?.calories ?? 0}
              </span>
              <span className='text-base text-text-muted'>
                cals per serving
              </span>
            </p>
            <div className='flex items-baseline gap-2'>
              <InlineInput
                label='Servings'
                type='number'
                error={errors.servings?.message}
                fieldClassName='w-16'
                className='text-2xl leading-none font-semibold text-text'
                {...numberField(register, 'servings')}
              />
              <span className='text-base text-text-muted'>servings</span>
            </div>
          </div>
          <RecipeMacroSummary
            featured={featured ?? { carbsG: 0, fatG: 0, proteinG: 0 }}
            original={original}
          />
        </div>

        <div className='flex flex-col gap-2 text-sm text-text-muted'>
          <div className='flex items-baseline gap-2'>
            <span aria-hidden='true' className='shrink-0'>
              /recipes/
            </span>
            <InlineInput
              label='Slug'
              error={errors.slug?.message}
              fieldClassName='w-full max-w-sm'
              readOnly={slugLocked}
              placeholder='blackened-chicken-alfredo'
              {...register('slug')}
            />
          </div>
          <div className='flex items-baseline gap-2'>
            <span aria-hidden='true' className='shrink-0'>
              A variation of
            </span>
            <InlineInput
              label='Variant of'
              error={errors.variantOf?.message}
              fieldClassName='w-full max-w-sm'
              placeholder='base-recipe-slug (optional)'
              {...register('variantOf', { setValueAs: optionalText })}
            />
          </div>
        </div>

        <div className='md:mt-auto'>
          <TagInput
            value={tags.field.value}
            onChange={tags.field.onChange}
            error={errors.tags?.message}
          />
        </div>
      </div>

      {/* The image generator's controls go below the photo */}
      <div className={RECIPE_HERO_PHOTO}>
        <RecipeImage imageUrl={imageUrl} title={title} />
      </div>
    </header>
  )
}
