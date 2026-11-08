'use client'

import type { ReactElement } from 'react'
import type { UseFieldArrayReturn } from 'react-hook-form'

import { useState } from 'react'
import { useFieldArray, useWatch } from 'react-hook-form'

import type { RecipeImportInput } from '@/validations'

import {
  AddRowButton,
  InlineInput,
  PlaceholderButton,
  RemoveRowButton,
} from '@/components/molecules'
import { formatMacroRatios } from '@/libs/recipes/macroRatios'
import { featuredBuild } from '@/libs/recipes/recipeDetail'

import {
  numberField,
  toNumber,
  toNutritionBuild,
  useRecipeForm,
} from './recipeFormFields'
import { RecipeNoteField } from './RecipeNoteField'

type RecipeNutritionEditorProps = {
  // The notes list, owned by the form because the notes section edits it too
  notes: UseFieldArrayReturn<RecipeImportInput, 'notes'>
}

type NutritionKind = RecipeImportInput['nutrition'][number]['kind']
type NutritionNoteKind = 'nutrition_intro' | 'nutrition_analysis'

// The page's cell padding, less the field's own, so the numbers sit where the page puts them
const cell = 'px-2 py-2 align-top sm:px-3'
const MACRO_FIELDS = [
  { field: 'carbsG', title: 'Carbs' },
  { field: 'fatG', title: 'Fat' },
  { field: 'proteinG', title: 'Protein' },
] as const

// Where each kind of nutrition note sits on the page, and how it looks there
const NUTRITION_NOTES: Record<
  NutritionNoteKind,
  { className: string; placeholder: string; empty: string }
> = {
  nutrition_intro: {
    className: 'text-sm text-text-muted',
    placeholder: 'A line above the table defining the builds',
    empty: 'Add an intro: a line above the table defining the builds',
  },
  nutrition_analysis: {
    className: 'rounded-xl bg-surface px-4 py-3 text-sm text-text-muted',
    placeholder: 'What the numbers mean, and where the savings come from',
    empty:
      'Add an analysis: what the numbers mean, and where the savings come from',
  },
}

const emptyRow = (kind: NutritionKind): RecipeImportInput['nutrition'][number] => ({
  kind,
  label: kind === 'traditional' ? 'Traditional' : '',
  isDefault: false,
  calories: 0,
  carbsG: 0,
  fatG: 0,
  proteinG: 0,
})

// The page's nutrition table with its numbers as fields, in the same row order: makeovers, the
// whole batch, then the traditional comparison. Ratios and the batch row update while typing.
// A row stays the kind it was added as.
export const RecipeNutritionEditor = ({
  notes,
}: RecipeNutritionEditorProps): ReactElement => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useRecipeForm()
  const nutrition = useFieldArray({ control, name: 'nutrition' })
  const rows = useWatch({ control, name: 'nutrition' })
  const noteRows = useWatch({ control, name: 'notes' })
  const servings = toNumber(useWatch({ control, name: 'servings' }))
  // The note just added, which takes the focus as it shows
  const [addedNote, setAddedNote] = useState<number>()

  const builds = rows.map(toNutritionBuild)
  const featured = featuredBuild(builds)
  const featuredIndex = featured ? builds.indexOf(featured) : -1
  const listMessage =
    errors.nutrition?.root?.message ?? errors.nutrition?.message

  // Exactly one row leads the recipe, so picking one clears the others
  const feature = (index: number): void => {
    nutrition.fields.forEach((_, other) => {
      setValue(`nutrition.${other}.isDefault`, other === index, {
        shouldDirty: true,
      })
    })
  }

  const renderRow = (id: string, index: number): ReactElement | null => {
    const build = builds[index]
    if (!build) return null
    const isMakeover = build.kind === 'makeover'
    const name = `Nutrition row ${index + 1}`

    return (
      <tr
        key={id}
        className={`group/editable border-t border-text-muted/30 ${isMakeover ? '' : 'text-text-muted italic'}`}
      >
        <th scope='row' className={`${cell} font-normal`}>
          <div className='flex flex-col gap-0.5'>
            <InlineInput
              label={`${name} label`}
              error={errors.nutrition?.[index]?.label?.message}
              placeholder={isMakeover ? 'Build name' : 'Traditional'}
              className={isMakeover ? 'font-semibold' : ''}
              {...register(`nutrition.${index}.label`)}
            />
            {isMakeover && (
              <label
                className={`flex w-fit cursor-pointer items-center gap-1 text-xs text-text-muted ${featuredIndex === index ? '' : 'opacity-0 group-focus-within/editable:opacity-100 group-hover/editable:opacity-100 pointer-coarse:opacity-100'}`}
              >
                <input
                  type='radio'
                  name='featured-build'
                  checked={featuredIndex === index}
                  onChange={() => feature(index)}
                />
                Featured
              </label>
            )}
            {errors.nutrition?.[index]?.isDefault?.message && (
              <p role='alert' className='text-xs text-red-400 not-italic'>
                {errors.nutrition[index].isDefault.message}
              </p>
            )}
          </div>
        </th>
        <td className={cell}>
          <span className='flex items-baseline'>
            ~
            <InlineInput
              fit
              label={`${name} calories`}
              type='number'
              step='any'
              error={errors.nutrition?.[index]?.calories?.message}
              {...numberField(register, `nutrition.${index}.calories`)}
            />
          </span>
        </td>
        {MACRO_FIELDS.map(({ field, title }) => (
          <td key={field} className={cell}>
            <span className='flex items-baseline'>
              <InlineInput
                fit
                label={`${name} ${title.toLowerCase()} grams`}
                type='number'
                step='any'
                error={errors.nutrition?.[index]?.[field]?.message}
                {...numberField(register, `nutrition.${index}.${field}`)}
              />
              g
            </span>
          </td>
        ))}
        <td className={`${cell} pt-2.5 whitespace-nowrap`}>
          {formatMacroRatios(build)}
        </td>
        <td className='py-2 pr-1 align-top'>
          <RemoveRowButton
            label={`Remove nutrition row ${index + 1}`}
            onClick={() => nutrition.remove(index)}
          />
        </td>
      </tr>
    )
  }

  const rowsOfKind = (kind: NutritionKind): (ReactElement | null)[] =>
    nutrition.fields.flatMap(({ id }, index) =>
      builds[index]?.kind === kind ? [renderRow(id, index)] : []
    )

  // A nutrition note in its place, or a placeholder in its shape while there is none
  const nutritionNotes = (kind: NutritionNoteKind): ReactElement => {
    const { className, placeholder, empty } = NUTRITION_NOTES[kind]
    const placed = notes.fields.flatMap(({ id }, index) =>
      noteRows[index]?.kind === kind ? [{ id, index }] : []
    )
    const add = (): void => {
      setAddedNote(notes.fields.length)
      notes.append({ kind, body: '' }, { shouldFocus: false })
    }

    if (placed.length === 0) {
      return <PlaceholderButton onClick={add}>{empty}</PlaceholderButton>
    }
    return (
      <>
        {placed.map(({ id, index }) => (
          <RecipeNoteField
            key={id}
            index={index}
            onRemove={() => notes.remove(index)}
            focusOnMount={index === addedNote}
            className={className}
            placeholder={placeholder}
          />
        ))}
      </>
    )
  }

  return (
    <section
      aria-labelledby='nutrition-heading'
      className='flex flex-col gap-3'
    >
      <h2 id='nutrition-heading' className='text-2xl font-semibold text-text'>
        Nutrition
      </h2>

      {nutritionNotes('nutrition_intro')}

      {listMessage && (
        <p role='alert' className='text-sm text-red-400'>
          {listMessage}
        </p>
      )}

      {/* A narrow screen scrolls the table sideways. Relative keeps the hidden field labels
          inside the scroller, not past the page's edge. */}
      <div className='relative overflow-x-auto rounded-lg border border-text-muted/30 bg-background'>
        <table className='w-full min-w-lg text-left text-sm'>
          <thead className='bg-surface text-text'>
            <tr>
              <td className='w-2/5' />
              <th scope='col' className={`${cell} font-semibold`}>
                Calories
              </th>
              {MACRO_FIELDS.map(({ field, title }) => (
                <th
                  key={field}
                  scope='col'
                  className={`${cell} font-semibold`}
                >
                  {title}
                </th>
              ))}
              <th
                scope='col'
                className={`${cell} font-semibold whitespace-nowrap`}
              >
                Ratio C/F/P
              </th>
              <td />
            </tr>
          </thead>
          <tbody className='text-text'>
            {rowsOfKind('makeover')}
            {featured && (
              <tr className='border-t border-text-muted/30'>
                <th scope='row' className={`${cell} font-semibold`}>
                  Whole batch (&times;{servings})
                </th>
                <td className={cell}>
                  ~{(featured.calories * servings).toLocaleString('en-US')}
                </td>
                {MACRO_FIELDS.map(({ field }) => (
                  <td key={field} className={cell}>
                    {Math.round(featured[field] * servings * 10) / 10}g
                  </td>
                ))}
                <td className={cell}>-</td>
                <td />
              </tr>
            )}
            {rowsOfKind('traditional')}
          </tbody>
        </table>
      </div>

      <div className='flex flex-wrap gap-4'>
        <AddRowButton onClick={() => nutrition.append(emptyRow('makeover'))}>
          Add makeover row
        </AddRowButton>
        <AddRowButton
          onClick={() => nutrition.append(emptyRow('traditional'))}
        >
          Add traditional row
        </AddRowButton>
      </div>

      {nutritionNotes('nutrition_analysis')}
    </section>
  )
}
