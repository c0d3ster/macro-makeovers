'use client'

import type { ReactElement, ReactNode } from 'react'

import { use, useState } from 'react'
import { useWatch } from 'react-hook-form'

import { appliesToBuild, buildTitle } from '@/libs/recipes/recipeBuilds'
import { recipeSlugSchema } from '@/validations'

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

// Over half the lines or steps differ from the default build, which reads more like a variant
const DIVERGENCE_SHARE = 0.5

// The fields a build can override, all optional. Blank falls back to the recipe.
export const RecipeBuildDetails = ({
  index,
}: RecipeBuildDetailsProps): ReactElement => {
  const {
    control,
    register,
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
  const recipeTitle = useWatch({ control, name: 'title' })
  const swap = builds[index]?.swap ?? {}

  // One swap pair is all a build needs, typed as two words. The draft holds a half-typed pair.
  // Pairs past the first, from an import, are kept as they are.
  const [savedFrom = '', savedTo = ''] = Object.entries(swap)[0] ?? []
  const [draft, setDraft] = useState({ from: savedFrom, to: savedTo })
  // The tag the shown pair last wrote, so editing it replaces that pair and no other
  const [shownFrom, setShownFrom] = useState(savedFrom)
  const swapFrom = draft.from
  const swapTo = draft.to
  const writeSwap = (from: string, to: string): void => {
    setDraft({ from, to })
    const cleanFrom = from.trim().toLowerCase()
    const cleanTo = to.trim().toLowerCase()
    const others = Object.fromEntries(
      Object.entries(swap).filter(([tag]) => tag !== shownFrom && tag !== cleanFrom)
    )
    const next = cleanFrom && cleanTo ? { [cleanFrom]: cleanTo, ...others } : others
    setShownFrom(cleanFrom && cleanTo ? cleanFrom : '')
    setValue(`${path}.swap`, Object.keys(next).length > 0 ? next : undefined, {
      shouldDirty: true,
    })
  }
  const swappedTitle = buildTitle(recipeTitle ?? '', { swap })
  const swapErrors = rowErrors?.swap as Record<string, { message?: string }> | undefined
  const swapError = swapErrors
    ? Object.values(swapErrors).find((issue) => issue?.message)?.message
    : undefined

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
  const [keyError, setKeyError] = useState<string>()
  const commitKey = (): void => {
    const next = draftKey.trim()
    setKeyError(undefined)
    if (!next || next === key) {
      setDraftKey(key)
      return
    }
    // A rejected key never reaches the lines or photos, so they keep pointing at this build
    if (!recipeSlugSchema.safeParse(next).success) {
      setKeyError('Use lowercase words separated by hyphens')
      return
    }
    if (builds.some((build, other) => other !== index && build.key === next)) {
      setKeyError(`Another build already uses the key "${next}"`)
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
          error={keyError ?? rowErrors?.key?.message}
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
          label='Swap a recipe tag'
          hint='Like turkey, for a recipe tag this build does not use'
          error={swapError}
        >
          <input
            className={INPUT}
            value={swapFrom}
            onChange={(event) => writeSwap(event.target.value, swapTo)}
            placeholder='turkey'
          />
        </Field>
        <Field
          label='For this tag'
          hint='The title and summary words swap too'
        >
          <input
            className={INPUT}
            value={swapTo}
            onChange={(event) => writeSwap(swapFrom, event.target.value)}
            placeholder='beef'
          />
        </Field>
        <Field
          label='Title while selected'
          hint='Blank uses the recipe title with the swap applied'
          error={rowErrors?.title?.message}
          wide
        >
          <input
            className={INPUT}
            placeholder={swappedTitle}
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
