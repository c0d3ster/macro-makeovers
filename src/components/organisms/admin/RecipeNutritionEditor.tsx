'use client'

import type { ReactElement } from 'react'
import type { UseFieldArrayReturn } from 'react-hook-form'

import { useFieldArray, useWatch } from 'react-hook-form'

import type { RecipeImportInput } from '@/validations'

import {
  AddRowButton,
  InlineInput,
  InlineSelect,
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

const cell = 'px-2 py-2 align-top'
const MACRO_FIELDS = [
  { field: 'carbsG', title: 'Carbs' },
  { field: 'fatG', title: 'Fat' },
  { field: 'proteinG', title: 'Protein' },
] as const

// The page's nutrition table with its numbers as fields, in the same row order: makeovers, the
// whole batch, then the traditional comparison. Ratios and the batch row update while typing.
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
        className={`border-t border-text-muted/30 ${isMakeover ? '' : 'text-text-muted italic'}`}
      >
        <th scope='row' className={`${cell} font-normal`}>
          <div className='flex flex-col gap-1'>
            <InlineInput
              label={`${name} label`}
              error={errors.nutrition?.[index]?.label?.message}
              className={isMakeover ? 'font-semibold' : ''}
              {...register(`nutrition.${index}.label`)}
            />
            <div className='flex flex-wrap items-center gap-2 text-xs font-normal not-italic'>
              <InlineSelect
                label={`${name} kind`}
                fieldClassName='w-fit'
                {...register(`nutrition.${index}.kind`, {
                  // A traditional row can never lead the recipe
                  onChange: () =>
                    setValue(`nutrition.${index}.isDefault`, false),
                })}
              >
                <option value='makeover'>Makeover</option>
                <option value='traditional'>Traditional</option>
              </InlineSelect>
              {isMakeover && (
                <label className='flex cursor-pointer items-center gap-1 text-text-muted'>
                  <input
                    type='radio'
                    name='featured-build'
                    checked={featuredIndex === index}
                    onChange={() => feature(index)}
                  />
                  Featured
                </label>
              )}
            </div>
            {errors.nutrition?.[index]?.isDefault?.message && (
              <p role='alert' className='text-xs text-red-400'>
                {errors.nutrition[index].isDefault.message}
              </p>
            )}
          </div>
        </th>
        <td className={cell}>
          <InlineInput
            label={`${name} calories`}
            type='number'
            step='any'
            error={errors.nutrition?.[index]?.calories?.message}
            {...numberField(register, `nutrition.${index}.calories`)}
          />
        </td>
        {MACRO_FIELDS.map(({ field, title }) => (
          <td key={field} className={cell}>
            <InlineInput
              label={`${name} ${title.toLowerCase()} grams`}
              type='number'
              step='any'
              error={errors.nutrition?.[index]?.[field]?.message}
              {...numberField(register, `nutrition.${index}.${field}`)}
            />
          </td>
        ))}
        <td className={`${cell} pt-3 whitespace-nowrap`}>
          {formatMacroRatios(build)}
        </td>
        <td className={`${cell} pt-2.5`}>
          <RemoveRowButton
            label={`Remove nutrition row ${index + 1}`}
            onClick={() => nutrition.remove(index)}
          />
        </td>
      </tr>
    )
  }

  const rowsOfKind = (
    kind: RecipeImportInput['nutrition'][number]['kind']
  ): (ReactElement | null)[] =>
    nutrition.fields.flatMap(({ id }, index) =>
      builds[index]?.kind === kind ? [renderRow(id, index)] : []
    )

  const notesOfKind = (
    kind: 'nutrition_intro' | 'nutrition_analysis'
  ): ReactElement[] =>
    notes.fields.flatMap(({ id }, index) =>
      noteRows[index]?.kind === kind
        ? [
            <RecipeNoteField
              key={id}
              index={index}
              onRemove={() => notes.remove(index)}
            />,
          ]
        : []
    )

  return (
    <section
      aria-labelledby='nutrition-heading'
      className='flex flex-col gap-3'
    >
      <h2 id='nutrition-heading' className='text-2xl font-semibold text-text'>
        Nutrition
      </h2>

      {notesOfKind('nutrition_intro')}

      {listMessage && (
        <p role='alert' className='text-sm text-red-400'>
          {listMessage}
        </p>
      )}

      {/* The fields need more room than the page's numbers, so a narrow screen scrolls sideways.
          Relative keeps the hidden field labels inside the scroller, not past the page's edge. */}
      <div className='relative overflow-x-auto rounded-lg border border-text-muted/30 bg-background'>
        <table className='w-full min-w-xl text-left text-sm'>
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
                <th scope='row' className={`${cell} px-3.5 font-semibold`}>
                  Whole batch (&times;{servings})
                </th>
                <td className={`${cell} px-3.5`}>
                  ~{(featured.calories * servings).toLocaleString('en-US')}
                </td>
                {MACRO_FIELDS.map(({ field }) => (
                  <td key={field} className={`${cell} px-3.5`}>
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
        <AddRowButton
          onClick={() =>
            nutrition.append({
              kind: 'makeover',
              label: '',
              isDefault: false,
              calories: 0,
              carbsG: 0,
              fatG: 0,
              proteinG: 0,
            })
          }
        >
          Add makeover row
        </AddRowButton>
        <AddRowButton
          onClick={() =>
            nutrition.append({
              kind: 'traditional',
              label: 'Traditional',
              isDefault: false,
              calories: 0,
              carbsG: 0,
              fatG: 0,
              proteinG: 0,
            })
          }
        >
          Add traditional row
        </AddRowButton>
      </div>

      {notesOfKind('nutrition_analysis')}

      <div className='flex flex-wrap gap-4'>
        <AddRowButton
          onClick={() => notes.append({ kind: 'nutrition_intro', body: '' })}
        >
          Add intro
        </AddRowButton>
        <AddRowButton
          onClick={() => notes.append({ kind: 'nutrition_analysis', body: '' })}
        >
          Add analysis
        </AddRowButton>
      </div>
    </section>
  )
}
