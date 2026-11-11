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

import { usePreviewBuild } from './buildPreview'
import { RecipeBuildDetails } from './RecipeBuildDetails'
import {
  featuredIndex,
  nextBuildKey,
  numberField,
  toBuildMacros,
  toNumber,
  useRecipeForm,
  useRenameBuildKey,
} from './recipeFormFields'
import { RecipeNoteField } from './RecipeNoteField'

type RecipeNutritionEditorProps = {
  // The notes list, owned by the form because the notes section edits it too
  notes: UseFieldArrayReturn<RecipeImportInput, 'notes'>
}

type NutritionNoteKind = 'nutrition_intro' | 'nutrition_analysis'
type Section = 'builds' | 'nutrition'

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

const ZERO_MACROS = { calories: 0, carbsG: 0, fatG: 0, proteinG: 0 }

// The page's nutrition table with its numbers as fields, in the same row order: builds, the
// whole batch, then the traditional comparison. Ratios and the batch row update while typing.
// Each build opens its details for the fields it can override.
export const RecipeNutritionEditor = ({
  notes,
}: RecipeNutritionEditorProps): ReactElement => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useRecipeForm()
  const builds = useFieldArray({ control, name: 'builds' })
  const renameBuildKey = useRenameBuildKey()
  const preview = usePreviewBuild()
  const comparisons = useFieldArray({ control, name: 'nutrition' })
  const buildRows = useWatch({ control, name: 'builds' }) ?? []
  const comparisonRows = useWatch({ control, name: 'nutrition' }) ?? []
  const noteRows = useWatch({ control, name: 'notes' })
  const servings = toNumber(useWatch({ control, name: 'servings' }))
  // The note just added, which takes the focus as it shows
  const [addedNote, setAddedNote] = useState<number>()
  // The build whose details are open
  const [openBuild, setOpenBuild] = useState<string>()

  const featured = featuredIndex(buildRows)
  const featuredRow = buildRows[featured]
  const featuredMacros = featuredRow ? toBuildMacros(featuredRow) : ZERO_MACROS
  const listMessage = errors.builds?.root?.message ?? errors.builds?.message

  // Exactly one build leads the recipe, so picking one clears the others
  const feature = (index: number): void => {
    builds.fields.forEach((_, other) => {
      setValue(`builds.${other}.isDefault`, other === index, {
        shouldDirty: true,
      })
    })
  }

  const macroCells = (section: Section, index: number, name: string): ReactElement => {
    const sectionErrors =
      section === 'builds' ? errors.builds?.[index] : errors.nutrition?.[index]
    const row = section === 'builds' ? buildRows[index] : comparisonRows[index]

    return (
      <>
        <td className={cell}>
          <span className='flex items-baseline'>
            ~
            <InlineInput
              fit
              label={`${name} calories`}
              type='number'
              step='any'
              error={sectionErrors?.calories?.message}
              {...numberField(register, `${section}.${index}.calories`)}
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
                error={sectionErrors?.[field]?.message}
                {...numberField(register, `${section}.${index}.${field}`)}
              />
              g
            </span>
          </td>
        ))}
        <td className={`${cell} pt-2.5 whitespace-nowrap`}>
          {row ? formatMacroRatios(toBuildMacros(row)) : '-'}
        </td>
      </>
    )
  }

  const buildRow = (id: string, index: number): ReactElement => {
    const name = `Build ${index + 1}`
    const isOpen = openBuild === id
    const isPreviewed = builds.fields.length > 1 && preview.index === index
    const key = buildRows[index]?.key
    const rowErrors = errors.builds?.[index]
    const hasDetailErrors = Boolean(
      rowErrors &&
        Object.keys(rowErrors).some(
          (field) =>
            !['label', 'calories', 'carbsG', 'fatG', 'proteinG'].includes(field)
        )
    )

    return (
      <tbody key={id} className='text-text'>
        <tr
          className={`group/editable border-t border-text-muted/30 ${isPreviewed ? 'bg-primary/10' : ''}`}
        >
          <th
            scope='row'
            className={`${cell} font-normal ${isPreviewed ? 'shadow-[inset_3px_0_0_0_var(--color-primary)]' : ''}`}
          >
            <div className='flex flex-col gap-0.5'>
              <InlineInput
                label={`${name} label`}
                error={rowErrors?.label?.message}
                placeholder='Build name'
                className='font-semibold'
                {...register(`builds.${index}.label`)}
              />
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted'>
                <label
                  className={`flex w-fit cursor-pointer items-center gap-1 ${featured === index ? '' : 'opacity-0 group-focus-within/editable:opacity-100 group-hover/editable:opacity-100 pointer-coarse:opacity-100'}`}
                >
                  <input
                    type='radio'
                    name='featured-build'
                    checked={featured === index}
                    onChange={() => feature(index)}
                  />
                  Featured
                </label>
                <button
                  type='button'
                  aria-expanded={isOpen}
                  onClick={() => setOpenBuild(isOpen ? undefined : id)}
                  className={`cursor-pointer underline hover:text-text ${hasDetailErrors ? 'text-red-400' : ''}`}
                >
                  {isOpen ? 'Hide build details' : 'Build details'}
                </button>
                {builds.fields.length > 1 && (
                  <button
                    type='button'
                    aria-pressed={isPreviewed}
                    disabled={!key}
                    onClick={() =>
                      preview.select(index === featured ? undefined : key)
                    }
                    className={`cursor-pointer underline hover:text-text ${isPreviewed ? 'font-medium text-primary no-underline' : ''}`}
                  >
                    {isPreviewed ? 'Previewing' : 'Switch to this build'}
                  </button>
                )}
              </div>
              {rowErrors?.isDefault?.message && (
                <p role='alert' className='text-xs text-red-400'>
                  {rowErrors.isDefault.message}
                </p>
              )}
            </div>
          </th>
          {macroCells('builds', index, name)}
          <td className='py-2 pr-1 align-top'>
            {builds.fields.length > 1 && (
              <RemoveRowButton
                label={`Remove build ${index + 1}`}
                onClick={() => {
                  const key = buildRows[index]?.key
                  if (key) renameBuildKey(key)
                  builds.remove(index)
                }}
              />
            )}
          </td>
        </tr>
        {isOpen && (
          <tr>
            <td colSpan={7} className='bg-surface/50 p-3'>
              <RecipeBuildDetails index={index} />
            </td>
          </tr>
        )}
      </tbody>
    )
  }

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
          {builds.fields.map(({ id }, index) => buildRow(id, index))}
          <tbody className='text-text'>
            <tr className='border-t border-text-muted/30'>
              <th scope='row' className={`${cell} font-semibold`}>
                Whole batch (&times;{servings})
              </th>
              <td className={cell}>
                ~{(featuredMacros.calories * servings).toLocaleString('en-US')}
              </td>
              {MACRO_FIELDS.map(({ field }) => (
                <td key={field} className={cell}>
                  {Math.round(featuredMacros[field] * servings * 10) / 10}g
                </td>
              ))}
              <td className={cell}>-</td>
              <td />
            </tr>
            {comparisons.fields.map(({ id }, index) => (
              <tr
                key={id}
                className='group/editable border-t border-text-muted/30 text-text-muted italic'
              >
                <th scope='row' className={`${cell} font-normal`}>
                  <InlineInput
                    label={`Traditional row ${index + 1} label`}
                    error={errors.nutrition?.[index]?.label?.message}
                    placeholder='Traditional'
                    {...register(`nutrition.${index}.label`)}
                  />
                </th>
                {macroCells('nutrition', index, `Traditional row ${index + 1}`)}
                <td className='py-2 pr-1 align-top'>
                  <RemoveRowButton
                    label={`Remove traditional row ${index + 1}`}
                    onClick={() => comparisons.remove(index)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex flex-wrap gap-4'>
        <AddRowButton
          onClick={() =>
            builds.append({
              key: nextBuildKey(buildRows.map(({ key }) => key)),
              label: '',
              isDefault: false,
              listed: true,
              ...ZERO_MACROS,
            })
          }
        >
          Add build
        </AddRowButton>
        <AddRowButton
          onClick={() =>
            comparisons.append({
              kind: 'traditional',
              label: 'Traditional',
              ...ZERO_MACROS,
            })
          }
        >
          Add traditional row
        </AddRowButton>
      </div>

      {nutritionNotes('nutrition_analysis')}
    </section>
  )
}
