'use client'

import type { ReactElement, ReactNode } from 'react'

import { use, useState } from 'react'
import { useWatch } from 'react-hook-form'

import { appliesToBuild } from '@/libs/recipes/recipeBuilds'

import { BuildPreviewContext } from './buildPreview'
import {
  featuredIndex,
  numberField,
  optionalText,
  useRecipeForm,
  useRenameBuildKey,
} from './recipeFormFields'

type RecipeBuildDetailsProps = {
  index: number
}

type FieldProps = {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  wide?: boolean
}

const INPUT =
  'w-full rounded-md border border-text-muted/30 bg-background px-2 py-1 text-sm text-text placeholder:text-text-muted/50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none aria-invalid:border-red-400'

const Field = ({
  label,
  hint,
  error,
  children,
  wide = false,
}: FieldProps): ReactElement => (
  <div className={`flex flex-col gap-1 ${wide ? 'sm:col-span-2' : ''}`}>
    <label className='flex flex-col gap-1 text-xs font-medium text-text'>
      {label}
      {children}
    </label>
    {hint && <span className='text-xs text-text-muted'>{hint}</span>}
    {error && (
      <span role='alert' className='text-xs text-red-400'>
        {error}
      </span>
    )}
  </div>
)

// "beef, ground beef" becomes ["beef", "ground beef"], and a blank field is no tags
const toTagList = (value: unknown): string[] | undefined => {
  const list = (Array.isArray(value) ? value.join(',') : String(value ?? ''))
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
  return list.length > 0 ? list : undefined
}

// Over half the lines or steps differ from the default build, which reads more like a variant
const DIVERGENCE_SHARE = 0.5

// The fields a build can override, all optional. Blank falls back to the recipe.
export const RecipeBuildDetails = ({
  index,
}: RecipeBuildDetailsProps): ReactElement => {
  const {
    control,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useRecipeForm()
  const renameBuildKey = useRenameBuildKey()
  const { renameKey } = use(BuildPreviewContext)
  const builds = useWatch({ control, name: 'builds' }) ?? []
  const ingredients = useWatch({ control, name: 'ingredients' })
  const steps = useWatch({ control, name: 'steps' })
  const key = builds[index]?.key ?? ''
  const [draftKey, setDraftKey] = useState(key)
  const rowErrors = errors.builds?.[index]
  const path = `builds.${index}` as const

  const defaultKey = builds[featuredIndex(builds)]?.key
  const differs = (rows: { onlyBuilds?: string[]; skipBuilds?: string[] }[]): number =>
    defaultKey && defaultKey !== key
      ? rows.filter((row) => appliesToBuild(row, key) !== appliesToBuild(row, defaultKey))
          .length
      : 0
  const divergent =
    differs(ingredients) > ingredients.length * DIVERGENCE_SHARE ||
    differs(steps) > steps.length * DIVERGENCE_SHARE

  // Renamed on blur, so the lines that point at this build follow the new key once
  const commitKey = (): void => {
    const next = draftKey.trim()
    if (!next || next === key) {
      setDraftKey(key)
      return
    }
    if (key) {
      renameBuildKey(key, next)
      renameKey(key, next)
    }
    setValue(`${path}.key`, next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className='flex flex-col gap-3'>
      {divergent && (
        <p role='status' className='text-sm text-accent'>
          This build differs a lot from the featured one. Consider a variant.
        </p>
      )}
      <div className='grid gap-3 sm:grid-cols-2'>
        <Field
          label='Key'
          hint={`Used in the link: ?build=${key || 'key'}`}
          error={rowErrors?.key?.message}
        >
          <input
            className={INPUT}
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            onBlur={commitKey}
            aria-invalid={Boolean(rowErrors?.key)}
          />
        </Field>
        <Field
          label='Title while selected'
          hint='Blank keeps the recipe title'
          error={rowErrors?.title?.message}
        >
          <input
            className={INPUT}
            placeholder={getValues('title')}
            {...register(`${path}.title`, { setValueAs: optionalText })}
          />
        </Field>
        <Field
          label='What this build changes'
          hint='Shown under the table while selected'
          error={rowErrors?.note?.message}
          wide
        >
          <textarea
            rows={2}
            className={INPUT}
            {...register(`${path}.note`, { setValueAs: optionalText })}
          />
        </Field>
        <Field
          label='Summary while selected'
          hint='Blank keeps the recipe summary'
          error={rowErrors?.summary?.message}
          wide
        >
          <textarea
            rows={2}
            className={INPUT}
            {...register(`${path}.summary`, { setValueAs: optionalText })}
          />
        </Field>
        <Field label='Cost tier (1 to 5)' error={rowErrors?.costTier?.message}>
          <input
            type='number'
            min={1}
            max={5}
            className={INPUT}
            {...numberField(register, `${path}.costTier`)}
          />
        </Field>
        <Field label='Difficulty (1 to 5)' error={rowErrors?.difficulty?.message}>
          <input
            type='number'
            min={1}
            max={5}
            className={INPUT}
            {...numberField(register, `${path}.difficulty`)}
          />
        </Field>
        <Field label='Prep minutes' error={rowErrors?.prepMinutes?.message}>
          <input
            type='number'
            min={0}
            className={INPUT}
            {...numberField(register, `${path}.prepMinutes`)}
          />
        </Field>
        <Field label='Cook minutes' error={rowErrors?.cookMinutes?.message}>
          <input
            type='number'
            min={0}
            className={INPUT}
            {...numberField(register, `${path}.cookMinutes`)}
          />
        </Field>
        <Field
          label='Tags to add'
          hint='Comma separated'
          error={rowErrors?.tagsAdd?.message}
        >
          <input
            className={INPUT}
            {...register(`${path}.tagsAdd`, { setValueAs: toTagList })}
          />
        </Field>
        <Field
          label='Recipe tags to drop'
          hint='Comma separated'
          error={rowErrors?.tagsRemove?.message}
        >
          <input
            className={INPUT}
            {...register(`${path}.tagsRemove`, { setValueAs: toTagList })}
          />
        </Field>
      </div>
      <label className='flex items-center gap-2 text-sm text-text'>
        <input type='checkbox' {...register(`${path}.listed`)} />
        Can lead a recipe card. Turn off for parts like &ldquo;Filling only&rdquo;.
      </label>
      {rowErrors?.listed?.message && (
        <p role='alert' className='text-xs text-red-400'>
          {rowErrors.listed.message}
        </p>
      )}
    </div>
  )
}
