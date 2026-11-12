'use client'

import type { KeyboardEvent, ReactElement } from 'react'

import { useController, useWatch } from 'react-hook-form'

import type { PhotoResponse } from '@/validations'

import { ChiliIcon } from '@/components/atoms'
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
import { buildTitle } from '@/libs/recipes/recipeBuilds'
import { formatMinutes } from '@/utils/formatMinutes'

import { usePreviewBuild } from './buildPreview'
import {
  featuredIndex,
  numberField,
  optionalText,
  toBuildMacros,
  toNumber,
  useRecipeForm,
} from './recipeFormFields'
import { RecipePhotoEditor } from './RecipePhotoEditor'

type RecipeHeroEditorProps = {
  // Set once the recipe exists. The slug then locks, because it is the recipe's address.
  recipeId?: string
  imageUrl?: string
  onChoosePhoto: (url: string) => Promise<PhotoResponse>
  // The same for the build being previewed, when it is not the featured one
  onChooseBuildPhoto: (key: string, url: string) => Promise<PhotoResponse>
  onClearBuildPhoto: (
    key: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>
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

const spiceSymbol = (isLit: boolean): ReactElement => (
  <ChiliIcon isDimmed={!isLit} />
)

// The top of the recipe page with its text as fields. Calories and the macro bar are worked out
// from the nutrition table below, and update while it is edited.
export const RecipeHeroEditor = ({
  recipeId,
  imageUrl,
  onChoosePhoto,
  onChooseBuildPhoto,
  onClearBuildPhoto,
}: RecipeHeroEditorProps): ReactElement => {
  const {
    control,
    register,
    formState: { errors },
  } = useRecipeForm()
  const cost = useController({ control, name: 'costTier' })
  const difficulty = useController({ control, name: 'difficulty' })
  const spice = useController({ control, name: 'spiceLevel' })
  const tags = useController({ control, name: 'tags' })
  const prepMinutes = useWatch({ control, name: 'prepMinutes' })
  const cookMinutes = useWatch({ control, name: 'cookMinutes' })
  const builds = useWatch({ control, name: 'builds' }) ?? []
  const comparisons = useWatch({ control, name: 'nutrition' }) ?? []

  const preview = usePreviewBuild()
  const recipeTitle = useWatch({ control, name: 'title' })
  const previewRow = builds[preview.index] ?? builds[featuredIndex(builds)]
  const featured = previewRow && toBuildMacros(previewRow)
  const original = comparisons[0] && toBuildMacros(comparisons[0])
  // A build other than the featured one is previewed, so its overrides show here
  const buildPreview = !preview.isFeatured && previewRow?.key ? previewRow : undefined
  // The photo editor follows the photo the page shows: a featured build with its own photo
  // edits that photo, and clearing it goes back to the recipe photo
  const photoBuild =
    buildPreview ??
    (previewRow?.key && preview.buildImages[previewRow.key] ? previewRow : undefined)
  const totalMinutes =
    toNumber(buildPreview?.prepMinutes ?? prepMinutes) +
    toNumber(buildPreview?.cookMinutes ?? cookMinutes)
  const overrides = buildPreview
    ? [
        buildPreview.title && `title "${buildPreview.title}"`,
        ...Object.entries(buildPreview.swap ?? {}).map(
          ([from, to]) => `swaps ${from} for ${to}`
        ),
        buildPreview.costTier && `cost ${'$'.repeat(buildPreview.costTier)}`,
        buildPreview.difficulty && `difficulty ${buildPreview.difficulty}`,
        (buildPreview.prepMinutes !== undefined ||
          buildPreview.cookMinutes !== undefined) &&
          'its own times',
      ].filter((item): item is string => Boolean(item))
    : []

  return (
    <div className='flex flex-col gap-5'>
      {buildPreview && (
        <div
          role='status'
          className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-text'
        >
          <p>
            Previewing the <strong>{buildPreview.label || buildPreview.key}</strong> build.{' '}
            {overrides.length > 0
              ? `It overrides ${overrides.join(', ')}.`
              : 'It overrides nothing on the recipe.'}{' '}
            The fields here edit the whole recipe, and the build&apos;s own are in its
            Build details. Faded lines and steps are not in this build.
          </p>
          <button
            type='button'
            onClick={() => preview.select(undefined)}
            className='cursor-pointer text-primary underline hover:no-underline'
          >
            Back to the featured build
          </button>
        </div>
      )}
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
            {formatMinutes(totalMinutes)}
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
        <ScalePicker
          label='Heat'
          value={spice.field.value}
          onChange={spice.field.onChange}
          onClear={() => spice.field.onChange(undefined)}
          renderSymbol={spiceSymbol}
          error={errors.spiceLevel?.message}
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
                fit
                label='Servings'
                type='number'
                error={errors.servings?.message}
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
              readOnly={Boolean(recipeId)}
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

        {/* Right under the rest, unlike the page's tags pinned to the bottom. The photo column
            here holds the photo tools too, so pinning would leave a large gap above the tags. */}
        <TagInput
          value={tags.field.value}
          onChange={tags.field.onChange}
          error={errors.tags?.message}
        />
      </div>

      <div className={RECIPE_HERO_PHOTO}>
        {photoBuild?.key ? (
          <RecipePhotoEditor
            // A fresh editor per build, so a candidate never carries over to another build
            key={photoBuild.key}
            imageUrl={preview.buildImages[photoBuild.key]}
            fallbackUrl={imageUrl}
            onChoose={(url) => onChooseBuildPhoto(photoBuild.key ?? '', url)}
            onClear={() => onClearBuildPhoto(photoBuild.key ?? '')}
            isSaved={preview.isBuildSaved(photoBuild.key)}
            build={{
              key: photoBuild.key,
              label: photoBuild.label,
              title: buildTitle(recipeTitle ?? '', {
                swap: photoBuild.swap ?? {},
                title: photoBuild.title,
              }),
              note: photoBuild.note,
            }}
          />
        ) : (
          <RecipePhotoEditor
            key='recipe'
            imageUrl={imageUrl}
            onChoose={onChoosePhoto}
            isSaved={Boolean(recipeId)}
          />
        )}
      </div>
    </header>
    </div>
  )
}
